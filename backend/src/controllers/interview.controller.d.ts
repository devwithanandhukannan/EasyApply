import type { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        userId: string;
    };
    company?: {
        companyId: string;
    };
}
export declare const getCompanyInterviewsList: (req: Request, res: Response) => Promise<void>;
export declare const getMyScheduledInterviews: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const confirmInterviewPresence: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const requestInterviewReschedule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const respondToReschedule: (req: Request, res: Response) => Promise<void>;
export declare const updateInterviewStatus: (req: Request, res: Response) => Promise<void>;
export declare const addInterviewFeedback: (req: Request, res: Response) => Promise<void>;
export declare const getInterviewFeedbacksList: (req: Request, res: Response) => Promise<void>;
export declare const updateInterviewFeedback: (req: Request, res: Response) => Promise<void>;
export declare const upsertInterviewFeedback: (req: Request, res: Response) => Promise<void>;
export declare const getInterviewFeedbackByCandidate: (req: Request, res: Response) => Promise<void>;
export declare const getApplicationDetailById: (req: Request, res: Response) => Promise<void>;
export declare const requestReschedule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const scheduleBulkInterviews: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=interview.controller.d.ts.map