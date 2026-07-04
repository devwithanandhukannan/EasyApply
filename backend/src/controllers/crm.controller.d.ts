import type { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        userId: string;
    };
    company?: {
        companyId: string;
    };
}
/**
 * GET /crm/candidates
 * List all CRM candidate profiles for this company (with filters).
 */
export declare const getCrmCandidates: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /crm/candidates/:id
 * Get single CRM profile with full interaction history.
 */
export declare const getCrmCandidateById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /crm/candidates
 * Manually add a candidate to the company CRM.
 * jobSeekerProfileId is required — the candidate must already exist in the system.
 */
export declare const addCrmCandidate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * PATCH /crm/candidates/:id
 * Update CRM profile metadata (status, notes, priority, tags, owner, starred).
 */
export declare const updateCrmCandidate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * DELETE /crm/candidates/:id
 * Remove candidate from company CRM.
 */
export declare const removeCrmCandidate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /crm/candidates/:id/interactions
 * Log a CRM interaction (call, email, note, etc.)
 */
export declare const logCrmInteraction: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /crm/talent-pools
 * List all talent pools for the company.
 */
export declare const getTalentPools: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /crm/talent-pools
 * Create a new talent pool.
 */
export declare const createTalentPool: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * PATCH /crm/talent-pools/:id
 * Update pool name or description.
 */
export declare const updateTalentPool: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * DELETE /crm/talent-pools/:id
 */
export declare const deleteTalentPool: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /crm/talent-pools/:id/members
 * Get all candidates in a talent pool.
 */
export declare const getTalentPoolMembers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /crm/talent-pools/:id/members
 * Add one or more candidates to a talent pool.
 * Body: { jobSeekerProfileIds: string[] }
 */
export declare const addTalentPoolMembers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * DELETE /crm/talent-pools/:id/members/:memberId
 * Remove a candidate from a talent pool.
 */
export declare const removeTalentPoolMember: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=crm.controller.d.ts.map