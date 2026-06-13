import cron from 'node-cron';
import { checkProximityForAllUsers } from './proximity.service.js';
import { Trajectory } from '../models/Trajectory.js';

export function startCronJobs(): void {
  cron.schedule('* * * * *', async () => {
    try {
      await checkProximityForAllUsers();
    } catch {
      // proximity check errors are non-critical
    }
  });

  // Delete trajectories older than 30 days at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      await Trajectory.deleteMany({ date: { $lt: cutoffStr } });
    } catch {
      // cleanup errors are non-critical
    }
  });
}
