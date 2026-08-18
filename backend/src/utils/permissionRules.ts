// backend/src/utils/permissionRules.ts

export type PermissionAction = 'read' | 'create' | 'edit' | 'delete' | 'manage' | 'schedule' | 'conduct' | 'feedback' | 'send';

export type GranularPermissions = Record<string, string[]>;

export const DEFAULT_ROLE_PRESETS: Record<string, { label: string; description: string; permissions: GranularPermissions }> = {
  COMPANY_ADMIN: {
    label: 'Company Admin',
    description: 'Full unrestricted administrative access to all company features, settings, and team controls.',
    permissions: {
      jobs: ['read', 'create', 'edit', 'delete'],
      walkin: ['read', 'create', 'manage', 'delete'],
      interviews: ['read', 'schedule', 'conduct', 'feedback', 'cancel'],
      talent_pool: ['read', 'create', 'edit', 'delete'],
      discovery: ['read', 'contact'],
      offers: ['read', 'create', 'edit', 'send', 'delete'],
      spot_jobs: ['read', 'create', 'manage'],
      team: ['read', 'invite', 'edit', 'delete'],
      settings: ['read', 'edit'],
    },
  },
  COMPANY_HR: {
    label: 'HR Manager',
    description: 'Full recruitment pipeline access including job postings, candidate evaluations, walk-in management, and offer letter dispatch.',
    permissions: {
      jobs: ['read', 'create', 'edit'],
      walkin: ['read', 'create', 'manage'],
      interviews: ['read', 'schedule', 'conduct', 'feedback'],
      talent_pool: ['read', 'create', 'edit'],
      discovery: ['read', 'contact'],
      offers: ['read', 'create', 'edit', 'send'],
      spot_jobs: ['read', 'create', 'manage'],
      team: ['read'],
      settings: ['read'],
    },
  },
  COMPANY_INTERVIEWER: {
    label: 'Technical Interviewer',
    description: 'Access to conduct live interviews, score candidates, host walk-in rooms, and review resumes in talent pool.',
    permissions: {
      jobs: ['read'],
      walkin: ['read', 'manage'],
      interviews: ['read', 'conduct', 'feedback'],
      talent_pool: ['read'],
      discovery: ['read'],
      offers: ['read'],
      spot_jobs: ['read'],
      team: ['read'],
      settings: ['read'],
    },
  },
  COMPANY_RECRUITER: {
    label: 'Talent Sourcer / Recruiter',
    description: 'Focus on seeker discovery, talent pool sourcing, scheduling interviews, and draft offers.',
    permissions: {
      jobs: ['read', 'create', 'edit'],
      walkin: ['read'],
      interviews: ['read', 'schedule'],
      talent_pool: ['read', 'create', 'edit'],
      discovery: ['read', 'contact'],
      offers: ['read', 'create'],
      spot_jobs: ['read'],
      team: ['read'],
      settings: ['read'],
    },
  },
  COMPANY_VIEWER: {
    label: 'Read-Only Viewer',
    description: 'View-only access across jobs, interviews, and candidate pipeline without modification rights.',
    permissions: {
      jobs: ['read'],
      walkin: ['read'],
      interviews: ['read'],
      talent_pool: ['read'],
      discovery: ['read'],
      offers: ['read'],
      spot_jobs: ['read'],
      team: ['read'],
      settings: ['read'],
    },
  },
};

/**
 * Check if a permission object satisfies the requested module and action
 */
export function hasPermission(
  permissions: GranularPermissions | null | undefined,
  moduleName: string,
  action: string = 'read'
): boolean {
  if (!permissions) return false;

  // Wildcard admin check
  if (permissions['*']?.includes('*') || permissions[moduleName]?.includes('*')) {
    return true;
  }

  const actions = permissions[moduleName];
  if (!Array.isArray(actions)) return false;

  // If user has 'manage', it implies read, create, edit, delete
  if (actions.includes('manage')) return true;

  return actions.includes(action);
}
