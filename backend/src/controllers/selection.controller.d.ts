import type { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        userId: string;
    };
    company?: {
        companyId: string;
    };
}
export declare const bulkUpdateApplicationStatus: (req: Request, res: Response) => Promise<void>;
export declare const bulkMoveApplications: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bulkStarApplications: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bulkSetPriority: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bulkAddTags: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFilteredApplications: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getApplicationDetails: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getApplicationTimeline: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=selection.controller.d.ts.map