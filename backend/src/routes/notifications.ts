import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { PushSubscription } from '../models/PushSubscription';
import { sendPushToUser } from '../services/push.service';

const router: Router = Router();
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
      // Upsert the new subscription
      await PushSubscription.findOneAndUpdate(
        { endpoint: req.body.endpoint },
        { userId: req.user!.userId, endpoint: req.body.endpoint, keys: req.body.keys },
        { upsert: true, new: true },
      );

      // Prune other subscriptions from the same push-service host for this user.
      // This prevents dev-churn (HMR/reload creating a new subscription every load)
      // from accumulating dead rows that produce 410 errors on every send.
      // Conservative: only removes subs with the same push host, so genuine
      // multi-device setups (different push services) are preserved.
      try {
        const newEndpointHost = new URL(req.body.endpoint as string).host;
        const userSubs = await PushSubscription.find({ userId: req.user!.userId });
        const stale = userSubs.filter((s) => {
          try {
            return new URL(s.endpoint).host === newEndpointHost && s.endpoint !== req.body.endpoint;
          } catch {
            return false;
          }
        });
        if (stale.length > 0) {
          await PushSubscription.deleteMany({ _id: { $in: stale.map((s) => s._id) } });
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[Push] pruned ${stale.length} stale subscription(s) for user ${req.user!.userId}`);
          }
        }
      } catch {
        // Pruning is best-effort; never fail the subscribe call because of it
      }

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

// Test push — sends an immediate notification to the requesting user
router.post('/test', async (req: AuthRequest, res: Response) => {
  try {
    const summary = await sendPushToUser(req.user!.userId, {
      title: '🔔 GeoTask — Notificación de prueba',
      body: '¡Las notificaciones push están funcionando correctamente!',
      // Unique tag per send so repeated test presses never collapse onto the same
      // notification (belt-and-suspenders alongside renotify: true in the SW).
      tag: `test-${Date.now()}`,
      icon: '/icons/icon-192x192.png',
    });

    if (summary.total === 0) {
      // No subscriptions stored for this user — frontend needs to re-subscribe
      res.status(200).json({ ok: false, reason: 'no-subscriptions' });
      return;
    }

    if (summary.sent === 0) {
      // Subscriptions exist but all sends failed (VAPID mismatch, expired, etc.)
      res.status(200).json({
        ok: false,
        reason: 'send-failed',
        errors: summary.errors,
      });
      return;
    }

    res.json({ ok: true, sent: summary.sent, total: summary.total });
  } catch (err) {
    res.status(500).json({ error: 'Error sending test notification' });
  }
});

export default router;
