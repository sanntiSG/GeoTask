import { Types } from 'mongoose';
import { User } from '../models/User';
import { Location } from '../models/Location';
import { Task } from '../models/Task';
import { haversineDistance } from '../utils/haversine';
import { sendPushToUser } from './push.service';

const DEV = process.env.NODE_ENV !== 'production';

/**
 * Check proximity for a single known-active user by their userId string.
 * Does NOT apply the 5-min freshness filter — the caller already knows the
 * user is active (just posted their position, just created a task, etc.).
 */
export async function checkProximityForUser(userId: string): Promise<void> {
  const now = new Date();

  const user = await User.findById(userId).lean();
  if (!user || !user.lastPosition) {
    if (DEV) console.log(`[Proximity] user ${userId}: no lastPosition — skipped`);
    return;
  }

  const { lat, lng } = user.lastPosition;
  const locations = await Location.find({ userId: user._id }).lean();

  if (DEV) console.log(`[Proximity] user ${userId}: pos=(${lat.toFixed(5)},${lng.toFixed(5)}) evaluating ${locations.length} location(s)`);

  let notified = 0;

  for (const location of locations) {
    const distance = Math.round(
      haversineDistance(lat, lng, location.coordinates.lat, location.coordinates.lng),
    );

    if (DEV) {
      console.log(
        `[Proximity]   loc "${location.name}": distance=${distance}m radius=${location.radius}m ${distance <= location.radius ? '✓ INSIDE' : '✗ outside'}`,
      );
    }

    if (distance > location.radius) continue;

    const pendingTasks = await Task.find({
      userId: user._id,
      locationId: location._id,
      status: 'pending',
    }).sort({ priority: -1, createdAt: 1 });

    if (DEV) console.log(`[Proximity]   → ${pendingTasks.length} pending task(s) at "${location.name}"`);

    const intervalMs = (user.settings.notificationInterval ?? 60) * 1000;

    for (const task of pendingTasks) {
      const shouldNotify =
        !task.lastNotified ||
        now.getTime() - task.lastNotified.getTime() >
          (task.notifyAgainEnabled ? task.notifyAgainAfter * 60 * 1000 : intervalMs);

      if (!shouldNotify) {
        if (DEV) console.log(`[Proximity]   task "${task.title}": cooldown not expired — skipped`);
        continue;
      }

      // Send immediately and persist lastNotified before moving on — avoids
      // the lost-timer race that occurred when setTimeout delays crossed cron ticks.
      await sendPushToUser(user._id.toString(), {
        title: `${task.emoji} ${task.title}`,
        body: `📍 ${location.name}`,
        tag: task._id.toString(),
        data: { taskId: task._id, locationId: location._id },
      });
      task.lastNotified = now;
      await task.save();
      notified++;

      if (DEV) console.log(`[Proximity]   task "${task.title}": notified ✓`);
    }

    await User.updateOne(
      { _id: user._id },
      { $inc: { [`visitCounts.${location._id}`]: 1 } },
    );
  }

  if (DEV) console.log(`[Proximity] user ${userId}: done — notified ${notified} task(s)`);
}

/**
 * Cron entry point: scan all users with a fresh position (within the last 5 min).
 */
export async function checkProximityForAllUsers(): Promise<void> {
  const users = await User.find({
    'lastPosition.updatedAt': { $gte: new Date(Date.now() - 5 * 60 * 1000) },
  })
    .select('_id')
    .lean();

  if (DEV) console.log(`[Proximity] cron tick — ${users.length} active user(s)`);

  await Promise.allSettled(
    users.map((u) => checkProximityForUser((u._id as Types.ObjectId).toString())),
  );
}
