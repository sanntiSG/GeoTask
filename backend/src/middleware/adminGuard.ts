import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export function adminGuard(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}
