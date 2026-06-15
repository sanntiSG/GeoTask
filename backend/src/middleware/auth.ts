import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';

declare global {
  namespace Express {
    // Augment the built-in User interface instead of Request.
    // This allows req.user to be properly typed without conflicting with
    // router overloads or Passport.js types.
    interface User extends JWTPayload {}
  }
}

export type AuthRequest = Request;

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.accessToken as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
};
