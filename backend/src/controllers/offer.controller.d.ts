import type { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        userId: string;
        email?: string;
    };
    company?: {
        companyId: string;
        name: string;
    };
}
export declare const getCompanyTemplates: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateOfferTemplate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteOfferTemplate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateOfferLetter: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createOfferLetter: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const signOfferLetter: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const sendOfferLetter: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const trackOfferEmail: (req: Request, res: Response) => Promise<void>;
export declare const respondToOffer: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCompanyOffers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getOfferDetails: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const downloadOfferPDF: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const generateTemplateWithAI: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createOfferTemplate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const respondToNegotiation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSalaryComparison: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=offer.controller.d.ts.map