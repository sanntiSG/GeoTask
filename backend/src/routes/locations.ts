import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Location } from '../models/Location';

const router = Router();
router.use(authMiddleware);

const locationValidation = [
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('coordinates.lat').isFloat({ min: -90, max: 90 }),
  body('coordinates.lng').isFloat({ min: -180, max: 180 }),
  body('radius').optional().isInt({ min: 50, max: 5000 }),
];

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const locations = await Location.find({ userId: req.user!.userId })
      .sort({ visitCount: -1, createdAt: -1 });
    res.json(locations);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', locationValidation, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const location = await Location.create({
      userId: req.user!.userId,
      ...req.body,
    });
    res.status(201).json(location);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', param('id').isMongoId(), async (req: AuthRequest, res: Response) => {
  try {
    const { name, coordinates, radius, address } = req.body;
    const update: Record<string, unknown> = {};
    if (name) update.name = name;
    if (coordinates) update.coordinates = coordinates;
    if (radius) update.radius = radius;
    if (address !== undefined) update.address = address;

    const location = await Location.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      update,
      { new: true },
    );

    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }
    res.json(location);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', param('id').isMongoId(), async (req: AuthRequest, res: Response) => {
  try {
    const location = await Location.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
