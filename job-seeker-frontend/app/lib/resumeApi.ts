// app/lib/resumeApi.ts
import api from './axios';

// ─── Types aligned to the updated Prisma schema ───────────────────────────
export interface ResumeScores {
  ats: number;
  formatting: number;
  keywords: number;
  grammar: number;
  readability: number;
  impact: number;
}

export interface ResumeAISuggestions {
  scores: ResumeScores;
  strengths: string[];
  improvements: Record<string, string>;
  missingSections: string[];
  keywordGaps: string[];
  jdOptimizationNotes?: string;
  keywordsInserted?: string[];
  suggestedBySection?: Record<string, string[]>;
}

export interface ResumeContent {
  htmlContent: string | null;
  rawText?: string | null;
  parsedData?: any;
  atsBreakdown?: Record<string, number>;
  autoCorrectedText?: string | null;
  margins?: { top: number; right: number; bottom: number; left: number };
  template?: string;
  versions?: ResumeVersion[];
  customPrompt?: string | null;
}

export interface ResumeVersion {
  id: string;
  label: string;
  htmlContent: string;
  savedAt: string;
}

export interface ResumeListItem {
  id: string;
  name: string;
  source: 'uploaded' | 'built';
  atsScore: number | null;
  isPrimary: boolean;
  aiSuggestions: ResumeAISuggestions | null;
  content: ResumeContent | null;
  createdAt: string;
  updatedAt: string;
}

// ─── API calls ────────────────────────────────────────────────────────────
export const uploadResume = (file: File, name?: string, jobDescription?: string) => {
  const form = new FormData();
  // Aligns to your backend controller upload.single('resume') configuration
  form.append('resume', file);
  if (name) form.append('name', name);
  if (jobDescription) form.append('jobDescription', jobDescription);

  return api.post<{ success: boolean; data: ResumeListItem }>('/jobseeker/resumes/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 90_000,
  });
};

export const generateCV = (customPrompt?: string, jobDescription?: string) =>
  api.post<{ success: boolean; data: ResumeListItem }>(
    '/jobseeker/resumes/generate', 
    { customPrompt, jobDescription }, 
    { timeout: 90_000 }
  );

export const convertToEditable = (id: string) =>
  api.post<{ success: boolean; data: ResumeListItem }>(
    `/jobseeker/resumes/${id}/convert`, 
    {}, 
    { timeout: 60_000 }
  );

export const optimizeForJD = (id: string, jobDescription: string) =>
  api.post<{ success: boolean; data: { htmlContent: string; notes: string; keywordsInserted: string[] } }>(
    `/jobseeker/resumes/${id}/optimize`, 
    { jobDescription }, 
    { timeout: 90_000 }
  );

export const getKeywordSuggestions = (id: string) =>
  api.get<{ success: boolean; data: { missingKeywords: string[]; suggestedBySection: Record<string, string[]> } }>(
    `/jobseeker/resumes/${id}/keywords`
  );

export const restoreVersion = (id: string, versionId: string) =>
  api.patch<{ success: boolean; data: { htmlContent: string } }>(
    `/jobseeker/resumes/${id}/restore/${versionId}`
  );

export const getAllResumes = () =>
  api.get<{ success: boolean; data: ResumeListItem[] }>('/jobseeker/resumes');

export const getResume = (id: string) =>
  api.get<{ success: boolean; data: ResumeListItem }>(`/jobseeker/resumes/${id}`);

export const updateResume = (id: string, payload: {
  htmlContent?: string;
  name?: string;
  isPrimary?: boolean;
  margins?: ResumeContent['margins'];
  template?: string;
  versionLabel?: string;
}) =>
  api.put<{ success: boolean }>(`/jobseeker/resumes/${id}`, payload);

export const deleteResume = (id: string) =>
  api.delete<{ success: boolean }>(`/jobseeker/resumes/${id}`);

// PATH: src/app/lib/resumeApi.ts
// ADD at bottom

export const scoreResumeContent = (id: string) =>
  api.post(`/jobseeker/resumes/${id}/score`);

export const getInlineSuggestions = (id: string) =>
  api.get(`/jobseeker/resumes/${id}/inline-suggestions`);

export const improveSelectedText = (selectedText: string, action: 'grammar' | 'rewrite' | 'custom', customPrompt?: string, context?: string) =>
  api.post('/jobseeker/resumes/improve-text', { selectedText, action, customPrompt, context });

export const generateRegionalResume = (country: string, style: string, jobDescription?: string) =>
  api.post('/jobseeker/resumes/generate-regional', { country, style, jobDescription });