import type { Request, Response } from 'express';
export declare const getCompanyDashboard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getJobApplications: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const aiFilterCandidates: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCandidateDetail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * BUG FIX: Was using invalid statuses like 'reviewed', 'shortlisted', 'interview', 'offer'
 * which don't exist in the ApplicationStatus enum. Now uses enum values only.
 */
export declare const updateApplicationStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const searchCandidates: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=companyDashboard.controller.d.ts.map