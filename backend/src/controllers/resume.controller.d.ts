import type { Request, Response } from 'express';
export declare const uploadAndAnalyze: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const generateCV: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const downloadUploadedPDF: (req: Request, res: Response) => Promise<void | Response<any, Record<string, any>>>;
export declare const convertResumeToHTML: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const optimizeResume: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getKeywordSuggestions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAllResumes: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getResumeById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateResume: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const restoreVersion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteResume: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const downloadResume: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const scoreContentOnly: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getInlineSuggestions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const improveSelectedText: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const generateRegionalCV: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=resume.controller.d.ts.map