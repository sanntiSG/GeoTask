import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors';
import { connectDatabase } from './config/database';
import './config/passport';
import { globalLimiter } from './middleware/rateLimiter';
import { initWebPush } from './services/push.service';
import { startCronJobs } from './services/cron.service';

import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import locationRoutes from './routes/locations';
import trajectoryRoutes from './routes/trajectory';
import notificationRoutes from './routes/notifications';
import positionRoutes from './routes/position';
import adminRoutes from './routes/admin';
import settingsRoutes from './routes/settings';

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
