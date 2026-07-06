import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.ts';
import { ROLES } from '../constants/roles.ts';
import { PermissionHelper } from '../utils/permissions.ts';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_access_secret';

const extractToken = (req: Request): string | undefined => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return req.cookies?.accessToken;
};

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        globalRoles: number;
        mobileNumber: string;
        email?: string;
      };
      company?: {
        companyId: string;
        companyRoles: number;
        companyName: string;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Session unauthorized or expired' });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string; globalRoles: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        mobileNumber: true,
        globalRoles: true,
        isVerified: true,
        jobSeekerProfile: { select: { email: true } }
      },
    });

    if (!user || !user.isVerified) {
      return res.status(401).json({ success: false, message: 'User not found or not verified' });
    }

    req.user = {
      userId: user.id,
      globalRoles: user.globalRoles,
      mobileNumber: user.mobileNumber,
      email: user.jobSeekerProfile?.email
    };

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
  }
};

export const authenticateCompany = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Company session unauthorized or expired' });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string; globalRoles: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        mobileNumber: true,
        globalRoles: true,
        isVerified: true,
        jobSeekerProfile: { select: { email: true } }
      },
    });

    if (!user || !user.isVerified) {
      return res.status(401).json({ success: false, message: 'User not found or not verified' });
    }

    const isPlatformAdmin = PermissionHelper.isPlatformAdmin(user.globalRoles);

    const teamMembership = await prisma.teamMember.findFirst({
      where: { userId: user.id, status: 'active' },
      include: {
        company: { select: { id: true, name: true, isVerified: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!teamMembership || !teamMembership.company) {
      if (isPlatformAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No company context available. Platform admins must join a company to access company features.',
        });
      }
      return res.status(403).json({ success: false, message: 'Unauthorized: No active company workspace found' });
    }

    if (!teamMembership.company.isVerified) {
      return res.status(403).json({ success: false, message: 'Company verification pending.' });
    }

    const hasCompanyPermission =
      PermissionHelper.hasAnyRole(teamMembership.roles, [
        ROLES.COMPANY_ADMIN,
        ROLES.COMPANY_HR,
        ROLES.COMPANY_INTERVIEWER,
        ROLES.COMPANY_VIEWER,
      ]) || isPlatformAdmin;

    if (!hasCompanyPermission) {
      return res.status(403).json({ success: false, message: 'Access Denied: Insufficient workspace privileges' });
    }

    req.user = {
      userId: user.id,
      globalRoles: user.globalRoles,
      mobileNumber: user.mobileNumber,
      email: user.jobSeekerProfile?.email
    };

    req.company = {
      companyId: teamMembership.company.id,
      companyRoles: teamMembership.roles,
      companyName: teamMembership.company.name,
    };

    return next();
  } catch (error) {
    console.error('Company Authentication Error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired company session token' });
  }
};

export const authorizeRoles = (...requiredRoles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

    if (PermissionHelper.isPlatformAdmin(req.user.globalRoles)) return next();

    const hasGlobalRole = PermissionHelper.hasAnyRole(req.user.globalRoles, requiredRoles);
    if (hasGlobalRole) return next();

    if (req.company) {
      const hasCompanyRole = PermissionHelper.hasAnyRole(req.company.companyRoles, requiredRoles);
      if (hasCompanyRole) return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access Denied: Insufficient privileges',
      requiredRoles: PermissionHelper.getRoleNames(requiredRoles.reduce((a, b) => a | b, 0)),
    });
  };
};

export const requireCompanyRole = (...requiredRoles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.company) return res.status(403).json({ success: false, message: 'Company context required' });

    if (req.user && PermissionHelper.isPlatformAdmin(req.user.globalRoles)) return next();

    const hasRole = PermissionHelper.hasAnyRole(req.company.companyRoles, requiredRoles);
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Insufficient company privileges',
        requiredRoles: PermissionHelper.getRoleNames(requiredRoles.reduce((a, b) => a | b, 0)),
      });
    }
    return next();
  };
};

export const requireJobSeeker = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

  if (!PermissionHelper.hasRole(req.user.globalRoles, ROLES.JOB_SEEKER)) {
    return res.status(403).json({ success: false, message: 'Access Denied: Job Seeker role required' });
  }
  return next();
};

export const requirePlatformAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

  if (!PermissionHelper.isPlatformAdmin(req.user.globalRoles)) {
    return res.status(403).json({ success: false, message: 'Access Denied: Platform Admin role required' });
  }
  return next();
};

export const requireJobSeekerOrCompanyAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

  if (PermissionHelper.isPlatformAdmin(req.user.globalRoles)) return next();

  const isJobSeeker = PermissionHelper.hasRole(req.user.globalRoles, ROLES.JOB_SEEKER);
  const isCompanyAdmin = 
    PermissionHelper.hasRole(req.user.globalRoles, ROLES.COMPANY_ADMIN) ||
    (req.company && PermissionHelper.hasRole(req.company.companyRoles, ROLES.COMPANY_ADMIN));

  if (isJobSeeker || isCompanyAdmin) return next();

  return res.status(403).json({ success: false, message: 'Access Denied: Job Seeker or Company Admin role required' });
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  console.log('reached optional auth middleware');
  const token = extractToken(req);

  if (!token) {
    req.user = undefined;
    return next();
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string; globalRoles: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        mobileNumber: true,
        globalRoles: true,
        isVerified: true,
        jobSeekerProfile: { select: { id: true, email: true, fullName: true } }
      },
    });

    // If user exists and verified, attach to request
    if (user && user.isVerified && user.jobSeekerProfile) {
      req.user = {
        userId: user.id,
        globalRoles: user.globalRoles,
        mobileNumber: user.mobileNumber,
        email: user.jobSeekerProfile.email,
        jobSeekerProfileId: user.jobSeekerProfile.id,
        fullName: user.jobSeekerProfile.fullName
      };
    }
  } catch (error) {
    // Invalid token? Just ignore and proceed as guest
    req.user = undefined;
  }

  return next();
};


export const requireAuth = authenticateCompany;