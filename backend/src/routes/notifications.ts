import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { PushSubscription } from '../models/PushSubscription.js';

const router = Router();
router.use(authMiddleware);

router.post(
  '/subscribe',
  [
    body('endpoint').isURL(),
    body('keys.p256dh').isString().notEmpty(),
    body('keys.auth').isString().notEmpty(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      await PushSubscription.findOneAndUpdate(
        { endpoint: req.body.endpoint },
        { userId: req.user!.userId, endpoint: req.body.endpoint, keys: req.body.keys },
        { upsert: true, new: true },
      );
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  },
);

router.delete('/unsubscribe', async (req: AuthRequest, res: Response) => {
  try {
    await PushSubscription.deleteMany({ userId: req.user!.userId });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/vapid-public-key', (_req, res: Response) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

export default router;
