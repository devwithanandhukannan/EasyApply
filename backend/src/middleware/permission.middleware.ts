// backend/src/middleware/permission.middleware.ts

import type { Request, Response, NextFunction } from 'express';
import { ROLES } from '../constants/roles.ts';
import { PermissionHelper } from '../utils/permissions.ts';
import { hasPermission, DEFAULT_ROLE_PRESETS } from '../utils/permissionRules.ts';

/**
 * Enforces dynamic granular permission on a company route
 * Example: requirePermission('jobs', 'create') or requirePermission('walkin', 'manage')
 */
export const requirePermission = (moduleName: string, action: string = 'read') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.company) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Missing company workspace session context.',
      });
    }

    // 1. Platform Admin bypass
    if (req.user && PermissionHelper.isPlatformAdmin(req.user.globalRoles)) {
      return next();
    }

    const { companyRoles, permissions } = req.company;

    // 2. Company Admin bypass (Company Admin has full authority over all modules)
    if (PermissionHelper.hasRole(companyRoles, ROLES.COMPANY_ADMIN)) {
      return next();
    }

    // 3. Check explicit custom granular permissions if configured
    if (permissions && typeof permissions === 'object') {
      if (hasPermission(permissions, moduleName, action)) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have '${action}' access for the '${moduleName}' module. Please contact your organization administrator.`,
        requiredPermission: `${moduleName}:${action}`,
      });
    }

    // 4. Fallback to default legacy preset permissions based on bitwise roles
    let fallbackPreset = DEFAULT_ROLE_PRESETS.COMPANY_VIEWER;
    if (PermissionHelper.hasRole(companyRoles, ROLES.COMPANY_HR)) {
      fallbackPreset = DEFAULT_ROLE_PRESETS.COMPANY_HR;
    } else if (PermissionHelper.hasRole(companyRoles, ROLES.COMPANY_INTERVIEWER)) {
      fallbackPreset = DEFAULT_ROLE_PRESETS.COMPANY_INTERVIEWER;
    }

    if (hasPermission(fallbackPreset.permissions, moduleName, action)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: Your current role does not have '${action}' access for '${moduleName}'.`,
      requiredPermission: `${moduleName}:${action}`,
    });
  };
};
