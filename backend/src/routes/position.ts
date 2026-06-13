import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { positionLimiter } from '../middleware/rateLimiter.js';
import { User } from '../models/User.js';
import { Trajectory } from '../models/Trajectory.js';
import { haversineDistance } from '../utils/haversine.js';

const router = Router();
router.use(authMiddleware, positionLimiter);

router.post(
  '/',
  [
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { lat, lng } = req.body as { lat: number; lng: number };
    const now = new Date();

    try {
      await User.updateOne(
        { _id: req.user!.userId },
        { lastPosition: { lat, lng, updatedAt: now } },
      );

      const today = now.toISOString().split('T')[0];

      await Trajectory.findOneAndUpdate(
        { userId: req.user!.userId, date: today },
        {
          $push: { points: { lat, lng, timestamp: now } },
        },
        { upsert: true, new: false },
      );

      // Recalculate total distance on the trajectory document
      const traj = await Trajectory.findOne({ userId: req.user!.userId, date: today });
      if (traj && traj.points.length > 1) {
        let totalDistance = 0;
        for (let i = 1; i < traj.points.length; i++) {
          totalDistance += haversineDistance(
            traj.points[i - 1].lat,
            traj.points[i - 1].lng,
            traj.points[i].lat,
            traj.points[i].lng,
          );
        }
        traj.totalDistance = Math.round(totalDistance);
        await traj.save();
      }

      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  },
);

export default router;
