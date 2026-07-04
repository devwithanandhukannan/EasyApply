import type { Request, Response } from 'express';
export declare const inviteTeamMember: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listTeamMembers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMemberRole: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeTeamMember: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const acceptInvite: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const setTeamMemberPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const teamMemberLogin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=team.controller.d.ts.map