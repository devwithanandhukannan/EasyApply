import type { Request, Response } from 'express';
import fs from 'fs';
import { prisma } from '../utils/prisma.ts';
import { extractText } from '../utils/textExtractor.ts';
import { ROLES } from '../constants/roles.ts';
import { PermissionHelper } from '../utils/permissions.ts';
import { ApplicationStatus } from '@prisma/client';
import { processApplicationMatchAsync } from '../services/applicationProcessor.service.ts';

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

    const existingApplication = await prisma.application.findFirst({
      where: { jobSeekerProfileId: profileId, jobPostingId }
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

        const contentData = {
          rawText,
          parsedData: {},
          atsBreakdown: {},
          autoCorrectedText: null,
          htmlContent: null,
          margins: { top: 60, right: 72, bottom: 60, left: 72 },
          template: 'default',
          versions: [],
        };
        const aiData = {
          scores: {},
          strengths: [],
          improvements: {},
          missingSections: [],
          keywordGaps: [],
          jdOptimizationNotes: '',
        };

        const newResume = await prisma.resume.create({
          data: {
            jobSeekerProfileId: profileId,
            name: `Resume for ${jobPosting.title} at ${jobPosting.company.name}`,
            source: 'uploaded',
            filePath: req.file.path,
            atsScore: null,
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
      let rawText = contentData.rawText;
      let parsedData = contentData.parsedData;

      if (!rawText && contentData.htmlContent) {
        // Strip HTML tags to form plain text rawText fallback for older built resumes
        rawText = contentData.htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        parsedData = contentData.parsedData || {};
      }

      if (!rawText) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(422).json({ success: false, message: 'Selected resume is corrupted. Please upload a new one.' });
      }
      
      finalResumeId = resumeId;
    } else {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Please select an existing resume or upload a new one'
      });
    }

    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          jobSeekerProfileId: profileId,
          jobPostingId,
          resumeId: finalResumeId,
          status: 'applied',
          pipelineIndex: 0,
          candidateNotes: '',
          isWithdrawn: false
        },
        include: {
          jobPosting: {
            include: { company: { select: { name: true, logoUrl: true } } }
          },
          resume: { select: { name: true, atsScore: true } }
        }
      });

      await tx.applicationHistory.create({
        data: {
          applicationId: app.id,
          toStatus: 'applied',
          changedBy: userId,
          notes: 'Application submitted successfully.'
        }
      });

      return app;
    });

    // Fire and forget background LLM processing
    processApplicationMatchAsync(application.id, finalResumeId, jobPostingId);

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

    if (!(await ensureJobSeeker(userId)))
      return res.status(403).json({ success: false, message: 'Access denied: Job seeker role required' });

    const profileId = await getProfileId(userId);
    if (!profileId)
      return res.status(404).json({ success: false, message: 'Profile not found' });

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

    if (!(await ensureJobSeeker(userId)))
      return res.status(403).json({ success: false, message: 'Access denied: Job seeker role required' });

    const profileId = await getProfileId(userId);
    if (!profileId)
      return res.status(404).json({ success: false, message: 'Profile not found' });

    const application = await prisma.application.findFirst({
      where: { id, jobSeekerProfileId: profileId },
      include: {
        jobPosting: {
          include: { company: { select: { name: true, logoUrl: true, industry: true, size: true } } }
        },
        resume: true,
        interviews: {
          include: {
            feedbacks: {
              include: {
                // FIX: InterviewFeedback.interviewer → TeamMember, not User
                // TeamMember has no jobSeekerProfile relation — only user relation
                interviewer: {
                  select: {
                    id: true,
                    user: { select: { id: true } }
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { scheduledTime: 'desc' }
        },
        offerLetters: { orderBy: { sentAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!application)
      return res.status(404).json({ success: false, message: 'Application not found' });

    return res.json({ success: true, data: application });
  } catch (error) {
    console.error('Get application details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch application details' });
  }
};

export const getTimelineDashboardView = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);

    if (!profileId)
      return res.status(404).json({ success: false, message: 'Job seeker profile not found.' });

    const applications = await prisma.application.findMany({
      where: { jobSeekerProfileId: profileId },
      include: {
        jobPosting: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                industry: true
              }
            }
          }
        },
        resume: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        interviews: {
          include: { feedbacks: true },
          orderBy: { scheduledTime: 'asc' }
        },
        offerLetters: { orderBy: { sentAt: 'desc' }, take: 1 }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const structuredTrack = applications.map(app => {
      const currentStatus = app.status;

      const livekitInterviews = app.interviews.map(i => ({
        interviewId: i.id,
        scheduledTime: i.scheduledTime,
        durationMinutes: i.durationMinutes,
        format: i.format,
        status: i.status,
        livekitRoomName: i.livekitRoomName,
        joinLink: ['confirmed', 'scheduled'].includes(i.status) ? i.joinLink : null,
        companyFeedback: i.feedbacks.map(f => ({
          verdict: f.verdict,
          notes: f.notes,
          createdAt: f.createdAt
        }))
      }));

      const activeOfferDoc = app.offerLetters[0]
        ? {
            id: app.offerLetters[0].id,
            status: app.offerLetters[0].status,
            filePath: app.offerLetters[0].filePath,
            sentAt: app.offerLetters[0].sentAt
          }
        : null;

      const mappedTimeline = app.statusHistory.map(h => ({
        stage: h.toStatus,
        date: h.createdAt,
        notes: h.notes
      }));

      return {
        applicationId: app.id,
        liveStatusBadge: currentStatus,
        isWithdrawn: app.isWithdrawn,
        currentStage: currentStatus,
        pipelineIndex: app.pipelineIndex ?? 0,
        candidateNotes: app.candidateNotes || '',
        appliedAt: app.appliedAt,
        updatedAt: app.updatedAt,
        jobDetails: {
          id: app.jobPosting.id,
          title: app.jobPosting.title,
          department: app.jobPosting.department || 'General',
          jobType: app.jobPosting.jobType,
          location: app.jobPosting.location || 'Remote'
        },
        companyDetails: {
          name: app.jobPosting.company.name,
          logoUrl: app.jobPosting.company.logoUrl,
          industry: app.jobPosting.company.industry || 'Technology'
        },
        resumeUsed: {
          id: app.resume.id,
          name: app.resume.name,
          downloadPath: app.resume.filePath
        },
        timelineView: mappedTimeline.length > 0
          ? mappedTimeline
          : [{ stage: 'applied', date: app.appliedAt, notes: 'Application submitted.' }],
        interviewHistory: livekitInterviews,
        activeOffer: activeOfferDoc,
        canWithdraw: !['hired', 'rejected', 'offer_sent'].includes(currentStatus) && !app.isWithdrawn
      };
    });

    return res.status(200).json({ success: true, data: structuredTrack });
  } catch (error: any) {
    console.error('Timeline view error:', error);
    return res.status(500).json({ success: false, message: 'Internal error.', error: error.message });
  }
};

export const updateCandidatePrivateNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);

    const application = await prisma.application.findFirst({
      where: { id, jobSeekerProfileId: profileId }
    });

    if (!application)
      return res.status(404).json({ success: false, message: 'Application not found.' });

    const updated = await prisma.application.update({
      where: { id },
      data: { candidateNotes: notes }
    });

    return res.status(200).json({ success: true, message: 'Notes updated successfully.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update notes.', error: error.message });
  }
};

export const withdrawApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    if (!(await ensureJobSeeker(userId)))
      return res.status(403).json({ success: false, message: 'Access denied: Job seeker role required' });

    const profileId = await getProfileId(userId);
    if (!profileId)
      return res.status(404).json({ success: false, message: 'Profile not found' });

    // FIX: include interviews so we can check active interview lock
    const application = await prisma.application.findFirst({
      where: { id, jobSeekerProfileId: profileId },
      include: { interviews: { select: { status: true } } }
    });

    if (!application)
      return res.status(404).json({ success: false, message: 'Application not found' });

    // FIX: added 'offer_sent' to blocked statuses — consistent with applicationTracker.controller.ts
    if (['hired', 'offer_sent'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw at this stage. Please contact the company directly.'
      });
    }

    // FIX: block withdrawal if any interview is confirmed, in progress, or completed
    const hasActiveInterview = application.interviews.some(i =>
      ['confirmed', 'in_progress', 'completed'].includes(i.status)
    );
    if (hasActiveInterview) {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw after interviews have been confirmed or completed.'
      });
    }

    const updatedRecord = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id },
        data: { status: 'rejected', isWithdrawn: true }
      });

      await tx.applicationHistory.create({
        data: {
          applicationId: id,
          toStatus: 'rejected',
          changedBy: userId,
          notes: 'Candidate withdrew application.'
        }
      });

      return updated;
    });

    return res.json({ success: true, message: 'Application withdrawn successfully', data: updatedRecord });
  } catch (error) {
    console.error('Withdraw application error:', error);
    return res.status(500).json({ success: false, message: 'Failed to withdraw application' });
  }
};