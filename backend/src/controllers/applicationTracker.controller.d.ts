import type { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        userId: string;
        mobileNumber: string;
        globalRoles: number;
        email?: string;
    };
}
export declare const getApplicationsTracker: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateApplicationNotes: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const withdrawApplicationTracker: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSingleApplicationDetails: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=applicationTracker.controller.d.ts.map