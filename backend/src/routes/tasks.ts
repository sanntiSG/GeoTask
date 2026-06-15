import { Router, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Task } from '../models/Task';
import { Location } from '../models/Location';
import { Types } from 'mongoose';
import { checkProximityForUser } from '../services/proximity.service';

const router: Router = Router();
router.use(authMiddleware);

const taskValidation = [
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('emoji').optional().isString().isLength({ max: 10 }),
  body('color').optional().matches(/^#[0-9a-fA-F]{6}$/),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('locationId').isMongoId(),
];

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { locationId, status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { userId: req.user!.userId };
    if (locationId) filter.locationId = new Types.ObjectId(locationId);
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate('locationId', 'name coordinates radius')
      .sort({ priority: -1, createdAt: -1 });

    res.json(tasks);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', taskValidation, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const location = await Location.findOne({
      _id: req.body.locationId,
      userId: req.user!.userId,
    });
    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    const task = await Task.create({
      userId: req.user!.userId,
      ...req.body,
    });

    const populated = await task.populate('locationId', 'name coordinates radius');
    res.status(201).json(populated);

    // Fire-and-forget: check if the user is already inside the task's location
    // so the notification arrives instantly when the task is created at the current spot.
    checkProximityForUser(req.user!.userId).catch(() => {});
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch(
  '/:id',
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { status, title, emoji, color, priority, recurrence, notifyAgainAfter, notifyAgainEnabled } = req.body;
      const update: Record<string, unknown> = {};

      if (title !== undefined) update.title = title;
      if (emoji !== undefined) update.emoji = emoji;
      if (color !== undefined) update.color = color;
      if (priority !== undefined) update.priority = priority;
      if (recurrence !== undefined) update.recurrence = recurrence;
      if (notifyAgainAfter !== undefined) update.notifyAgainAfter = notifyAgainAfter;
      if (notifyAgainEnabled !== undefined) update.notifyAgainEnabled = notifyAgainEnabled;
      if (status !== undefined) {
        update.status = status;
        if (status === 'done') update.completedAt = new Date();
      }

      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.user!.userId },
        update,
        { new: true },
      ).populate('locationId', 'name coordinates radius');

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json(task);
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  },
);

router.delete('/:id', param('id').isMongoId(), async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
