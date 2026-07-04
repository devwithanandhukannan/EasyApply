// src/utils/permissions.ts
import { ROLES, ROLE_NAMES } from '../constants/roles.ts';
export class PermissionHelper {
    /**
     * Check if user has a specific role
     */
    static hasRole(userRoles, role) {
        return (userRoles & role) === role;
    }
    /**
     * Add a role to user's roles
     */
    static addRole(userRoles, role) {
        return userRoles | role;
    }
    /**
     * Remove a role from user's roles
     */
    static removeRole(userRoles, role) {
        return userRoles & ~role;
    }
    /**
     * Check if user has ANY of the specified roles
     */
    static hasAnyRole(userRoles, roles) {
        return roles.some((role) => this.hasRole(userRoles, role));
    }
    /**
     * Check if user has ALL of the specified roles
     */
    static hasAllRoles(userRoles, roles) {
        return roles.every((role) => this.hasRole(userRoles, role));
    }
    /**
     * Get array of role names from bitwise roles
     */
    static getRolesArray(userRoles) {
        const roles = [];
        Object.entries(ROLES).forEach(([key, value]) => {
            if (this.hasRole(userRoles, value)) {
                roles.push(key);
            }
        });
        return roles;
    }
    /**
     * Get human-readable role names
     */
    static getRoleNames(userRoles) {
        const names = [];
        Object.entries(ROLES).forEach(([_, value]) => {
            if (this.hasRole(userRoles, value)) {
                names.push(ROLE_NAMES[value]);
            }
        });
        return names;
    }
    /**
     * Convert role names to bitwise value
     */
    static rolesToBits(roleNames) {
        return roleNames.reduce((bits, name) => {
            const roleKey = name.toUpperCase().replace(/ /g, '_');
            const roleValue = ROLES[roleKey];
            return roleValue ? bits | roleValue : bits;
        }, 0);
    }
    /**
     * Check if roles contain any company role
     */
    static hasCompanyRole(userRoles) {
        return this.hasAnyRole(userRoles, [
            ROLES.COMPANY_ADMIN,
            ROLES.COMPANY_HR,
            ROLES.COMPANY_INTERVIEWER,
            ROLES.COMPANY_VIEWER,
        ]);
    }
    /**
     * Check if user is platform admin
     */
    static isPlatformAdmin(userRoles) {
        return this.hasRole(userRoles, ROLES.PLATFORM_ADMIN);
    }
}
//# sourceMappingURL=permissions.js.map