import { Router, Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import { adminGuard } from '../middleware/adminGuard.js';
import { AuthRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { Location } from '../models/Location.js';
import { Trajectory } from '../models/Trajectory.js';
import { PushSubscription } from '../models/PushSubscription.js';

const router = Router();
router.use(authMiddleware, adminGuard);

router.get('/stats', async (_req, res: Response) => {
  try {
    const now = new Date();
    const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalTasks, totalLocations, active24h, active7d, active30d] =
      await Promise.all([
        User.countDocuments(),
        Task.countDocuments(),
        Location.countDocuments(),
        User.countDocuments({ lastActive: { $gte: ago24h } }),
        User.countDocuments({ lastActive: { $gte: ago7d } }),
        User.countDocuments({ lastActive: { $gte: ago30d } }),
      ]);

    res.json({ totalUsers, totalTasks, totalLocations, active24h, active7d, active30d });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email avatar role lastActive createdAt')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => u._id);
    const [taskCounts, locationCounts] = await Promise.all([
      Task.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
      Location.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
    ]);

    const taskMap = Object.fromEntries(taskCounts.map((t) => [t._id.toString(), t.count]));
    const locationMap = Object.fromEntries(locationCounts.map((l) => [l._id.toString(), l.count]));

    const enriched = users.map((u) => ({
      ...u.toObject(),
      taskCount: taskMap[u._id.toString()] ?? 0,
      locationCount: locationMap[u._id.toString()] ?? 0,
    }));

    res.json({ users: enriched, total, page: Number(page), limit: Number(limit) });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete(
  '/users/:id',
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const targetId = req.params.id;
    if (targetId === req.user!.userId) {
      res.status(400).json({ error: 'Cannot delete yourself' });
      return;
    }

    try {
      await Promise.all([
        Task.deleteMany({ userId: targetId }),
        Location.deleteMany({ userId: targetId }),
        Trajectory.deleteMany({ userId: targetId }),
        PushSubscription.deleteMany({ userId: targetId }),
        User.deleteOne({ _id: targetId }),
      ]);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  },
);

export default router;
