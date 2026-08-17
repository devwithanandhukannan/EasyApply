import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const adminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized: No admin token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.role !== 'platform_admin') {
      res.status(403).json({ success: false, message: 'Forbidden: Platform admin access required' });
      return;
    }
    (req as any).adminId = decoded.adminId;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired admin token' });
  }
};
