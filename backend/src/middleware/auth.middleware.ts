// src/middleware/auth.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../utils/prisma.ts';
import { log } from 'node:console';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_access_secret';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
      company?: {
        companyId: string;
        email: string;
      };
    }
  }
}

// Job Seeker Authentication
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Session unauthorized or expired' });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string; role: UserRole };
    req.user = { userId: decoded.userId, role: decoded.role };
    return next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired session token' });
  }
};

// Company Authentication
export const authenticateCompany = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Company session unauthorized or expired' });
  }

  try {
    // 1. Verify the access token sent by the client
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string; role: UserRole };
    
    // 2. Safeguard: Ensure the user actually has a company-related role
    if (decoded.role !== UserRole.company_admin && decoded.role !== UserRole.company_hr) {
      return res.status(403).json({ success: false, message: 'Access Denied: Insufficient workspace privileges.' });
    }

    // 3. Query DB to look up the company this user belongs to
    const teamMembership = await prisma.teamMember.findUnique({
      where: { userId: decoded.userId },
      include: {
        company: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    // 4. If no membership or company is found, block them
    if (!teamMembership || !teamMembership.company || teamMembership.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Unauthorized: No active company workspace found for this user.' });
    }

    // 5. Attach the critical company info to the request object for your controllers
    req.company = {
      companyId: teamMembership.company.id,
      email: teamMembership.company.email,
    };

    // Also attach the user context just in case a controller needs track of WHO did it
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    return next();
  } catch (error) {
    console.error('Company Authentication Error:', error);
    return res.status(403).json({ success: false, message: 'Invalid or expired company session token' });
  }
};

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access Denied: Insufficient privileges.' 
      });
    }
    return next();
  };
};

// Alias for company routes
export const requireAuth = authenticateCompany;