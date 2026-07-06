import { prisma } from '../utils/prisma.ts';
import { analyzeResume } from './groq.service.ts';

/**
 * Runs asynchronously in the background to analyze the resume against the job description
 * and saves the resulting match score and analysis to the Application record.
 */
export const processApplicationMatchAsync = async (
  applicationId: string,
  resumeId: string,
  jobPostingId: string
) => {
  try {
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      select: { description: true }
    });

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { content: true }
    });

    if (!jobPosting || !resume) {
      console.warn(`[Background Match] Missing data for application ${applicationId}`);
      return;
    }

    const contentData = (resume.content as any) ?? {};
    let rawText = contentData.rawText;

    if (!rawText && contentData.htmlContent) {
      rawText = contentData.htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    if (!rawText) {
      console.warn(`[Background Match] No text found in resume ${resumeId} to analyze.`);
      return;
    }

    // Call LLM for scoring
    const analysis = await analyzeResume(rawText, jobPosting.description);
    
    // Save to the application instead of overwriting the resume
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        matchScore: analysis.scores?.ats ?? null,
        matchAnalysis: {
          scores: analysis.scores ?? {},
          strengths: analysis.strengths ?? [],
          improvements: analysis.improvements ?? {},
          missingSections: analysis.missingSections ?? [],
          keywordGaps: analysis.keywordGaps ?? [],
          jdOptimizationNotes: analysis.jdOptimizationNotes ?? '',
          atsBreakdown: analysis.atsBreakdown ?? {}
        }
      }
    });

    console.log(`[Background Match] Successfully processed match score for application ${applicationId}`);
  } catch (error) {
    console.error(`[Background Match] Error processing application ${applicationId}:`, error);
  }
};
