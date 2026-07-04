export declare const aggregateSalaryBenchmarks: (title: string, location: string, experienceRequired: string, offeredSalaryStr?: string) => Promise<any>;
export declare const generateFreshCV: (profile: any, customPrompt?: string, jobDescription?: string) => Promise<any>;
export declare const optimizeForJD: (htmlContent: string, jobDescription: string) => Promise<any>;
export declare const suggestKeywords: (htmlContent: string) => Promise<any>;
export declare const convertToHTML: (parsedData: any) => Promise<any>;
export declare const generateJobDescription: (roughDescription: string, title?: string, department?: string, locationType?: string, experienceRequired?: string, skills?: string[], salaryRange?: string) => Promise<string>;
export declare const rankCandidates: (jobDescription: string, requiredSkills: any, // Json field from JobPosting (array stored as Prisma Json)
candidates: Array<{
    applicationId: string;
    candidateName: string;
    skills: string[];
    experience: any[];
    education: any[];
    projects: any[];
    certifications: string[];
    atsScore: number | null;
    resumeContent: any;
}>, topN: number, customPrompt?: string) => Promise<any>;
export declare const rankCandidatesAgainstQuery: (queryDescription: string, requiredSkills: string[], candidates: Array<{
    id: string;
    fullName: string;
    skills: string[];
    experience: any[];
    education: any[];
    projects: any[];
    certifications: string[];
    atsScore: number | null;
}>, topN: number) => Promise<any>;
export declare const generateOfferLetterTemplate: (templateName: string, description?: string, companyName?: string) => Promise<any>;
export declare const scoreResumeContent: (htmlContent: string) => Promise<any>;
export declare const generateInlineSuggestions: (htmlContent: string) => Promise<any>;
export declare const processTextSelection: (selectedText: string, action: "grammar" | "rewrite" | "custom", customPrompt?: string, context?: string) => Promise<any>;
export declare const generateRegionalResumeTemplate: (profile: any, country: string, style: "modern" | "classic" | "minimal" | "executive", jobDescription?: string) => Promise<any>;
export declare const analyzeResume: (rawText: string, jobDescription?: string) => Promise<any>;
//# sourceMappingURL=groq.service.d.ts.map