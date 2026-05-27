import type { Request, Response } from 'express';
import fs from 'fs';
import { prisma } from '../utils/prisma.ts';
import { extractText } from '../utils/textExtractor.ts';
import { analyzeResume } from '../services/groq.service.ts';
import { ROLES } from '../constants/roles.ts';           // ← fixed import
import { PermissionHelper } from '../utils/permissions.ts';

const getProfileId = async (userId: string) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
  return profile?.id ?? null;
};

const ensureJobSeeker = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { globalRoles: true },          
  });
  return user ? PermissionHelper.hasRole(user.globalRoles, ROLES.JOB_SEEKER) : false;
};


export const applyToJob = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Role check
    if (!(await ensureJobSeeker(userId))) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: 'Access denied: Job seeker role required' });
    }

    const profileId = await getProfileId(userId);
    if (!profileId) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Job seeker profile not found' });
    }

    const { jobPostingId, resumeId, applyWithNew } = req.body;

    if (!jobPostingId) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Job posting ID required' });
    }

    // Verify job posting exists and is active
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: { company: { select: { name: true } } }
    });

    if (!jobPosting) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    if (jobPosting.status !== 'active') {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'This job posting is no longer accepting applications' });
    }

    // Check if already applied
    const existingApplication = await prisma.application.findFirst({
      where: {
        jobSeekerProfileId: profileId,
        jobPostingId,
      }
    });

    if (existingApplication) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this position',
        applicationId: existingApplication.id
      });
    }

    let finalResumeId = resumeId;

    // Handle new resume upload
    if (applyWithNew === 'true' && req.file) {
      try {
        const rawText = await extractText(req.file.path, req.file.mimetype);
        if (!rawText || rawText.length < 50) {
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          return res.status(422).json({
            success: false,
            message: 'Could not extract text from resume. Please ensure it\'s a valid PDF or DOCX file.'
          });
        }

        const analysis = await analyzeResume(rawText, jobPosting.description);
        const contentData = {
          rawText,
          parsedData: analysis.parsedData ?? {},
          atsBreakdown: analysis.atsBreakdown ?? {},
          autoCorrectedText: analysis.autoCorrectedText ?? null,
          htmlContent: null,
          margins: { top: 60, right: 72, bottom: 60, left: 72 },
          template: 'default',
          versions: [],
        };
        const aiData = {
          scores: analysis.scores ?? {},
          strengths: analysis.strengths ?? [],
          improvements: analysis.improvements ?? {},
          missingSections: analysis.missingSections ?? [],
          keywordGaps: analysis.keywordGaps ?? [],
          jdOptimizationNotes: analysis.jdOptimizationNotes ?? '',
        };
        const atsScore = analysis.scores?.ats ?? null;

        const newResume = await prisma.resume.create({
          data: {
            jobSeekerProfileId: profileId,
            name: `Resume for ${jobPosting.title} at ${jobPosting.company.name}`,
            source: 'uploaded',
            filePath: req.file.path,
            atsScore,
            content: contentData,
            aiSuggestions: aiData,
            isPrimary: false,
          },
        });
        finalResumeId = newResume.id;
      } catch (error) {
        console.error('Error processing uploaded resume:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({ success: false, message: 'Failed to process uploaded resume' });
      }
    } else if (resumeId) {
      const existingResume = await prisma.resume.findFirst({
        where: { id: resumeId, jobSeekerProfileId: profileId }
      });
      if (!existingResume) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: 'Selected resume not found' });
      }
      const contentData = (existingResume.content as any) ?? {};
      if (!contentData.parsedData || !contentData.rawText) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(422).json({ success: false, message: 'Selected resume is corrupted. Please upload a new one.' });
      }
      const reanalysis = await analyzeResume(contentData.rawText, jobPosting.description);
      const updatedAiData = {
        scores: reanalysis.scores ?? {},
        strengths: reanalysis.strengths ?? [],
        improvements: reanalysis.improvements ?? {},
        missingSections: reanalysis.missingSections ?? [],
        keywordGaps: reanalysis.keywordGaps ?? [],
        jdOptimizationNotes: reanalysis.jdOptimizationNotes ?? '',
      };
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          aiSuggestions: updatedAiData,
          atsScore: reanalysis.scores?.ats ?? existingResume.atsScore,
        }
      });
      finalResumeId = resumeId;
    } else {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Please select an existing resume or upload a new one'
      });
    }

    const application = await prisma.application.create({
      data: {
        jobSeekerProfileId: profileId,
        jobPostingId,
        resumeId: finalResumeId,
        status: 'applied',
      },
      include: {
        jobPosting: {
          include: {
            company: { select: { name: true, logoUrl: true } }
          }
        },
        resume: { select: { name: true, atsScore: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Apply to job error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
};

export const getMyApplications = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    console.log(userId);
    
    if (!(await ensureJobSeeker(userId))) {
      return res.status(403).json({ success: false, message: 'Access denied: Job seeker role required' });
    }

    const profileId = await getProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const { status, limit = '20', page = '1' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { jobSeekerProfileId: profileId };
    if (status && status !== 'all') where.status = status;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          jobPosting: {
            include: { company: { select: { name: true, logoUrl: true } } }
          },
          resume: { select: { name: true, atsScore: true } }
        },
        orderBy: { appliedAt: 'desc' },
        skip,
        take,
      }),
      prisma.application.count({ where }),
    ]);

    return res.json({
      success: true,
      data: applications,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / take),
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
};

export const getApplicationDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    if (!(await ensureJobSeeker(userId))) {
      return res.status(403).json({ success: false, message: 'Access denied: Job seeker role required' });
    }

    const profileId = await getProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const application = await prisma.application.findFirst({
      where: { id, jobSeekerProfileId: profileId },
      include: {
        jobPosting: {
          include: { company: { select: { name: true, logoUrl: true, industry: true, size: true } } }
        },
        resume: true,
        interviews: { include: { feedbacks: true }, orderBy: { scheduledTime: 'desc' } },
        offerLetters: { orderBy: { sentAt: 'desc' } }
      }
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    return res.json({ success: true, data: application });
  } catch (error) {
    console.error('Get application details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch application details' });
  }
};

export const withdrawApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    if (!(await ensureJobSeeker(userId))) {
      return res.status(403).json({ success: false, message: 'Access denied: Job seeker role required' });
    }

    const profileId = await getProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const application = await prisma.application.findFirst({
      where: { id, jobSeekerProfileId: profileId }
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (['offer', 'hired'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw application at this stage. Please contact the company directly.'
      });
    }

    await prisma.application.delete({ where: { id } });
    return res.json({ success: true, message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Withdraw application error:', error);
    return res.status(500).json({ success: false, message: 'Failed to withdraw application' });
  }
};