import { User } from '../models/User.js';
import { Location } from '../models/Location.js';
import { Task } from '../models/Task.js';
import { haversineDistance } from '../utils/haversine.js';
import { sendPushToUser } from './push.service.js';

export async function checkProximityForAllUsers(): Promise<void> {
  const now = new Date();

  const users = await User.find({
    'lastPosition.updatedAt': { $gte: new Date(Date.now() - 5 * 60 * 1000) },
  }).lean();

  await Promise.allSettled(
    users.map(async (user) => {
      if (!user.lastPosition) return;

      const { lat, lng } = user.lastPosition;
      const locations = await Location.find({ userId: user._id }).lean();

      for (const location of locations) {
        const distance = haversineDistance(
          lat,
          lng,
          location.coordinates.lat,
          location.coordinates.lng,
        );

        if (distance > location.radius) continue;

        const pendingTasks = await Task.find({
          userId: user._id,
          locationId: location._id,
          status: 'pending',
        }).sort({ priority: -1, createdAt: 1 });

        const intervalMs = (user.settings.notificationInterval ?? 60) * 1000;

        for (let i = 0; i < pendingTasks.length; i++) {
          const task = pendingTasks[i];

          const shouldNotify =
            !task.lastNotified ||
            now.getTime() - task.lastNotified.getTime() >
              (task.notifyAgainEnabled ? task.notifyAgainAfter * 60 * 1000 : intervalMs);

          if (!shouldNotify) continue;

          setTimeout(async () => {
            await sendPushToUser(user._id.toString(), {
              title: `${task.emoji} ${task.title}`,
              body: `📍 ${location.name}`,
              tag: task._id.toString(),
              data: { taskId: task._id, locationId: location._id },
            });
            task.lastNotified = new Date();
            await task.save();
          }, i * intervalMs);
        }

        await User.updateOne(
          { _id: user._id },
          { $inc: { [`visitCounts.${location._id}`]: 1 } },
        );
      }
    }),
  );
}
