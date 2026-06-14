import { Router, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Trajectory } from '../models/Trajectory';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const trajectories = await Trajectory.find({ userId: req.user!.userId })
      .select('date totalDistance points.length exported createdAt')
      .sort({ date: -1 })
      .limit(30);
    res.json(trajectories);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:date', async (req: AuthRequest, res: Response) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(req.params.date)) {
    res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    return;
  }

  try {
    const trajectory = await Trajectory.findOne({
      userId: req.user!.userId,
      date: req.params.date,
    });

    if (!trajectory) {
      res.status(404).json({ error: 'No trajectory for this date' });
      return;
    }

    res.json(trajectory);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:date/exported', async (req: AuthRequest, res: Response) => {
  try {
    await Trajectory.updateOne(
      { userId: req.user!.userId, date: req.params.date },
      { exported: true },
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
