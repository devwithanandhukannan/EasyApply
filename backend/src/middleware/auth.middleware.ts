import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token missing or invalid',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret') as { userId: string };
    req.user = { userId: decoded.userId };
    console.log('Authenticated user ID:', req.user.userId);
    return next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token expired or altered',
    });
  }
};