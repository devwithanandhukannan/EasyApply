import type { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        userId: string;
        mobileNumber: string;
        role: string;
    };
}
export declare const getProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=profile.controller.d.ts.map