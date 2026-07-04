import type { Request, Response } from 'express';
export declare const sendCompanyOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const verifyCompanyOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const registerCompany: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const verifyCompanyEmail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const companyLogin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const resendCompanyVerificationEmail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const checkCompanySession: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyCompanyProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCompanyProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCompanyPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCompanyLogo: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const requestMobileChangeOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const verifyMobileChangeOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const requestEmailChangeOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const verifyEmailChangeOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=companyAuth.controller.d.ts.map