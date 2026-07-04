import type { Request, Response } from 'express';
export declare const sendOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const verifyOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const checkMe: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const logoutUser: (_req: Request, res: Response) => Response<any, Record<string, any>>;
export declare const checkEmailExists: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.controller.d.ts.map