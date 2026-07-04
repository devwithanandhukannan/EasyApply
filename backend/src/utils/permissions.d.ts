export declare class PermissionHelper {
    /**
     * Check if user has a specific role
     */
    static hasRole(userRoles: number, role: number): boolean;
    /**
     * Add a role to user's roles
     */
    static addRole(userRoles: number, role: number): number;
    /**
     * Remove a role from user's roles
     */
    static removeRole(userRoles: number, role: number): number;
    /**
     * Check if user has ANY of the specified roles
     */
    static hasAnyRole(userRoles: number, roles: number[]): boolean;
    /**
     * Check if user has ALL of the specified roles
     */
    static hasAllRoles(userRoles: number, roles: number[]): boolean;
    /**
     * Get array of role names from bitwise roles
     */
    static getRolesArray(userRoles: number): string[];
    /**
     * Get human-readable role names
     */
    static getRoleNames(userRoles: number): string[];
    /**
     * Convert role names to bitwise value
     */
    static rolesToBits(roleNames: string[]): number;
    /**
     * Check if roles contain any company role
     */
    static hasCompanyRole(userRoles: number): boolean;
    /**
     * Check if user is platform admin
     */
    static isPlatformAdmin(userRoles: number): boolean;
}
//# sourceMappingURL=permissions.d.ts.map