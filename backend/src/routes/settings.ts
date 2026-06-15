import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { Location } from '../models/Location';
import { Trajectory } from '../models/Trajectory';
import { PushSubscription } from '../models/PushSubscription';

const router: Router = Router();
router.use(authMiddleware);

router.patch(
  '/',
  [
    body('trackingStart').optional().matches(/^\d{2}:\d{2}$/),
    body('trackingEnd').optional().matches(/^\d{2}:\d{2}$/),
    body('defaultRadius').optional().isInt({ min: 50, max: 5000 }),
    body('notificationInterval').optional().isInt({ min: 10, max: 3600 }),
    body('renotifyAfter').optional().isInt({ min: 1, max: 1440 }),
    body('renotifyEnabled').optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const allowed = ['trackingStart', 'trackingEnd', 'defaultRadius', 'notificationInterval', 'renotifyAfter', 'renotifyEnabled'];
      const update: Record<string, unknown> = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          update[`settings.${key}`] = req.body[key];
        }
      }

      const user = await User.findByIdAndUpdate(req.user!.userId, update, { new: true }).select('settings');
      res.json(user?.settings);
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  },
);

router.delete('/account', async (req: AuthRequest, res: Response) => {
  try {
    await Promise.all([
      Task.deleteMany({ userId: req.user!.userId }),
      Location.deleteMany({ userId: req.user!.userId }),
      Trajectory.deleteMany({ userId: req.user!.userId }),
      PushSubscription.deleteMany({ userId: req.user!.userId }),
      User.deleteOne({ _id: req.user!.userId }),
    ]);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
