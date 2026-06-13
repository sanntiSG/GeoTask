import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors.js';
import { connectDatabase } from './config/database.js';
import './config/passport.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { initWebPush } from './services/push.service.js';
import { startCronJobs } from './services/cron.service.js';

import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import locationRoutes from './routes/locations.js';
import trajectoryRoutes from './routes/trajectory.js';
import notificationRoutes from './routes/notifications.js';
import positionRoutes from './routes/position.js';
import adminRoutes from './routes/admin.js';
import settingsRoutes from './routes/settings.js';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", process.env.FRONTEND_URL ?? ''],
      },
    },
  }),
);
app.use(cors(corsOptions));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json({ limit: '10kb' }));
app.use(globalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/trajectory', trajectoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/position', positionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap(): Promise<void> {
  await connectDatabase();
  initWebPush();
  startCronJobs();
  app.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
}

bootstrap().catch((err) => {
  console.error('[Bootstrap error]', err);
  process.exit(1);
});
