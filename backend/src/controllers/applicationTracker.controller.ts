import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';
import { ApplicationStatus } from '@prisma/client';

interface AuthRequest extends Request {
  user?: { userId: string; mobileNumber: string; globalRoles: number; email?: string };
}

// 1. GET /api/jobseeker/applications/tracker
export const getApplicationsTracker = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized session' });
    }

    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!profile) {
      return res.status(200).json({ success: true, data: [] });
    }

    const applications = await prisma.application.findMany({
      where: { jobSeekerProfileId: profile.id },
      include: {
        jobPosting: {
          include: {
            company: {
              select: { name: true, logoUrl: true, industry: true }
            }
          }
        },
        resume: {
          select: { id: true, name: true, filePath: true }
        },
        statusHistory: { 
          orderBy: { createdAt: 'asc' }
        },
        interviews: {
          include: {
            feedbacks: {
              select: {
                id: true,
                verdict: true,
                notes: true,
                createdAt: true
              }
            }
          },
          orderBy: { scheduledTime: 'desc' }
        },
        offerLetters: {
          orderBy: { sentAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const mappedTrackerData = applications.map(app => {
      let liveStatusBadge = app.status.toLowerCase();
      if (app.isWithdrawn) {  // ✅ Now exists in schema
        liveStatusBadge = 'withdrawn';
      }

      const interviewHistory = app.interviews.map(interview => ({
        interviewId: interview.id,
        scheduledTime: interview.scheduledTime,
        durationMinutes: interview.durationMinutes,
        format: interview.format,
        status: interview.status,
        livekitRoomName: interview.livekitRoomName,
        joinLink: ['scheduled', 'in_progress'].includes(interview.status) ? interview.joinLink : null,
        companyFeedback: interview.feedbacks.map(f => ({
          verdict: f.verdict,
          notes: f.notes || 'No notes shared by interviewer.',
          createdAt: f.createdAt
        }))
      }));

      const visualTimeline = app.statusHistory.map(log => ({
        stage: log.status,
        date: log.createdAt,
        notes: log.notes || `Moved to stage: ${log.status.replace('_', ' ')}`
      }));

      // ✅ FIXED: Changed `interview` to `app.interviews`
      const hasInterviewsStarted = app.interviews.some(i => 
        ['confirmed', 'in_progress', 'completed'].includes(i.status)
      );
      
      const canWithdraw = !app.isWithdrawn && 
                          !['hired', 'rejected', 'offer_sent'].includes(app.status) && 
                          !hasInterviewsStarted;

      return {
        applicationId: app.id,
        liveStatusBadge,
        isWithdrawn: app.isWithdrawn,
        currentStage: app.status,
        pipelineIndex: app.pipelineIndex,
        candidateNotes: app.candidateNotes || '',  // ✅ Now exists in schema
        appliedAt: app.appliedAt,
        updatedAt: app.updatedAt,
        jobDetails: {
          id: app.jobPostingId,
          title: app.jobPosting.title,
          department: app.jobPosting.department || '',
          jobType: app.jobPosting.jobType,
          location: app.jobPosting.location || 'Remote'
        },
        companyDetails: {
          name: app.jobPosting.company.name,
          logoUrl: app.jobPosting.company.logoUrl,
          industry: app.jobPosting.company.industry
        },
        resumeUsed: {
          id: app.resume.id,
          name: app.resume.name,
          downloadPath: app.resume.filePath
        },
        timelineView: visualTimeline,
        interviewHistory,
        activeOffer: app.offerLetters[0] 
          ? {
              id: app.offerLetters[0].id,
              status: app.offerLetters[0].status,
              filePath: app.offerLetters[0].filePath,
              sentAt: app.offerLetters[0].sentAt
            } 
          : null,
        canWithdraw
      };
    });

    return res.status(200).json({ success: true, data: mappedTrackerData });
  } catch (error) {
    console.error('Tracker data payload extraction runtime crash:', error);
    return res.status(500).json({ success: false, error: 'Internal system tracking service failure' });
  }
};

// 2. PATCH /api/jobseeker/applications/:id/notes
export const updateApplicationNotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id: applicationId } = req.params;
    const { notes } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized access point context' });
    }

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        jobSeekerProfile: { userId }
      }
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Target application profile map mismatch' });
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: { candidateNotes: notes } 
    });

    return res.status(200).json({ success: true, message: 'Personal tracking notes updated successfully' });
  } catch (error) {
    console.error('Update personal notes database crash:', error);
    return res.status(500).json({ success: false, error: 'Failed to update personal application metadata structure' });
  }
};


// 3. POST /api/jobseeker/applications/:id/withdraw
export const withdrawApplicationTracker = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id: applicationId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized context scope signature' });
    }

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        jobSeekerProfile: { userId }
      },
      include: { interviews: true }
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application history index mismatch' });
    }

    const lockingInterviewStatuses = ['confirmed', 'in_progress', 'completed'];
    const executionLocked = application.interviews.some(i => lockingInterviewStatuses.includes(i.status));

    if (executionLocked || ['hired', 'rejected', 'offer_sent'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        error: 'Withdrawal locked. Process is too far advanced in corporate processing pipelines.'
      });
    }

    await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: {
          isWithdrawn: true,  
          status: ApplicationStatus.rejected
        }
      }),
      prisma.applicationHistory.create({
        data: {
          applicationId,
          status: ApplicationStatus.rejected,
          notes: 'Candidate triggered one-tap withdrawal pipeline rejection directly from dashboard.'
        }
      })
    ]);

    return res.status(200).json({ success: true, message: 'Application cleanly withdrawn from job tracking queues' });
  } catch (error) {
    console.error('Transaction execution processing fail on withdrawal routine:', error);
    return res.status(500).json({ success: false, error: 'Transactional state tracking update rollback occurred' });
  }
};