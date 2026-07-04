import express from 'express';
import type { Request, Response } from 'express';
export declare const createJob: (req: Request, res: Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const getAllCompanyJobs: (req: Request, res: Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const generateAIDescription: (req: Request, res: Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const getJobDetails: (req: Request, res: Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const updateJob: (req: Request, res: Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const deleteJob: (req: Request, res: Response) => Promise<express.Response<any, Record<string, any>>>;
//# sourceMappingURL=companyJob.controller.d.ts.map