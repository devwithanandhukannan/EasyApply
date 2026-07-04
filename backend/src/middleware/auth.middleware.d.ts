import type { Request, Response, NextFunction } from 'express';
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
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const authenticateCompany: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const authorizeRoles: (...requiredRoles: number[]) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const requireCompanyRole: (...requiredRoles: number[]) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const requireJobSeeker: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const requirePlatformAdmin: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const requireJobSeekerOrCompanyAdmin: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.middleware.d.ts.map