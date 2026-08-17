import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.ts';

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const admin = await prisma.platformAdmin.findUnique({ where: { email } });
    if (!admin)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: 'platform_admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email }
    });
  } catch (err) {
    console.error('[Admin Login]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAdminProfile = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const admin = await prisma.platformAdmin.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    return res.json({ success: true, admin });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
