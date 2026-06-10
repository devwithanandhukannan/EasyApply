import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';
import { ApplicationStatus } from '@prisma/client';
import { log } from 'node:console';

interface AuthRequest extends Request {
  user?: { userId: string; mobileNumber: string; globalRoles: number; email?: string };
}
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
      if (app.isWithdrawn) {
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
        stage: log.toStatus,
        date: log.createdAt,
        notes: log.notes || `Moved to stage: ${log.toStatus.replace(/_/g, ' ')}`
      }));

      const hasInterviewsStarted = app.interviews.some(i => 
        ['confirmed', 'in_progress', 'completed'].includes(i.status)
      );
      
      const canWithdraw = !app.isWithdrawn && 
                          !['hired', 'rejected', 'offer_sent'].includes(app.status) && 
                          !hasInterviewsStarted;

      // Extract details from the most recent offer letter context if available
      const activeOfferRecord = app.offerLetters[0];

      return {
        applicationId: app.id,
        liveStatusBadge,
        isWithdrawn: app.isWithdrawn,
        currentStage: app.status,
        pipelineIndex: app.pipelineIndex,
        candidateNotes: app.candidateNotes || '',
        appliedAt: app.appliedAt,
        updatedAt: app.updatedAt,
        jobDetails: {
          id: app.jobPostingId,
          title: activeOfferRecord?.position || app.jobPosting.title,
          department: activeOfferRecord?.department || app.jobPosting.department || '',
          jobType: app.jobPosting.jobType,
          locationType: app.jobPosting.locationType || 'Onsite',
          location: activeOfferRecord?.location || app.jobPosting.location || 'Remote',
          experienceRequired: app.jobPosting.experienceRequired || 'Not specified',
          // Maps either the finalized compensation package or the listing bracket
          compensationContext: activeOfferRecord 
            ? `${activeOfferRecord.currency} ${Number(activeOfferRecord.salary).toLocaleString()}`
            : app.jobPosting.salaryRange || 'Disclosed upon screening'
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
        activeOffer: activeOfferRecord 
          ? {
              id: activeOfferRecord.id,
              status: activeOfferRecord.status,
              filePath: activeOfferRecord.filePath,
              sentAt: activeOfferRecord.sentAt,
              finalPosition: activeOfferRecord.position,
              finalSalary: activeOfferRecord.salary,
              currency: activeOfferRecord.currency,
              startDate: activeOfferRecord.startDate,
              employmentType: activeOfferRecord.employmentType
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

    // Capture the current status before updating it for complete history metrics
    const previousStatus = application.status;

    await prisma.$transaction([
      // 1. Update the application status flags cleanly
      prisma.application.update({
        where: { id: applicationId },
        data: {
          isWithdrawn: true,  
          status: ApplicationStatus.rejected
        }
      }),
      
      // 2. Write the audit log history entry with all schema-required keys
      prisma.applicationHistory.create({
        data: {
          applicationId,
          fromStatus: previousStatus, // Populates the optional tracking field
          toStatus: ApplicationStatus.rejected, // This is where toStatus belongs!
          changedBy: userId, // Required by schema
          changedByType: 'candidate', // Required by schema
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

export const getSingleApplicationDetails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { applicationId } = req.params;
    
    console.log('Received request for application tracker details with params:', { userId, applicationId });
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized session' });
    }

    if (!applicationId) {
      return res.status(400).json({ success: false, error: 'Missing target application parameters' });
    }

    // 1. Locate current candidate workspace registration matching auth token identity
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!profile) {
      return res.status(403).json({ success: false, error: 'Candidate profile identity workspace not found' });
    }

    // 2. Locate application payload and strictly isolate search scope via candidate key constraints
    const application = await prisma.application.findFirst({
      where: { 
        id: applicationId,
        jobSeekerProfileId: profile.id 
      },
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
      }
    });

    // If application doesn't exist or profile mismatch occurs, safely refuse access
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        error: 'Application records not located or unauthorized tracking permission requested.' 
      });
    }

    // 3. Transform raw records exactly like your list tracker mapper
    let liveStatusBadge = application.status.toLowerCase();
    if (application.isWithdrawn) {
      liveStatusBadge = 'withdrawn';
    }

    const interviewHistory = application.interviews.map(interview => ({
      interviewId: interview.id,
      scheduledTime: interview.scheduledTime,
      durationMinutes: interview.durationMinutes,
      format: interview.format,
      status: interview.status,
      livekitRoomName: interview.livekitRoomName,
      // Fixed potential string type safety arrays evaluation
      joinLink: ['scheduled', 'confirmed', 'in_progress'].includes(interview.status) ? interview.joinLink : null,
      companyFeedback: interview.feedbacks.map(f => ({
        verdict: f.verdict,
        notes: f.notes || 'No notes shared by interviewer.',
        createdAt: f.createdAt
      }))
    }));

    const visualTimeline = application.statusHistory.map(log => ({
      stage: log.toStatus,
      date: log.createdAt,
      notes: log.notes || `Moved to stage: ${log.toStatus.replace(/_/g, ' ')}`
    }));

    const hasInterviewsStarted = application.interviews.some(i => 
      ['confirmed', 'in_progress', 'completed'].includes(i.status)
    );
    
    const canWithdraw = !application.isWithdrawn && 
                        !['hired', 'rejected', 'offer_sent'].includes(application.status) && 
                        !hasInterviewsStarted;

    const activeOfferRecord = application.offerLetters[0];

    const mappedPayload = {
      applicationId: application.id,
      liveStatusBadge,
      isWithdrawn: application.isWithdrawn,
      currentStage: application.status,
      pipelineIndex: application.pipelineIndex,
      candidateNotes: application.candidateNotes || '',
      appliedAt: application.appliedAt,
      updatedAt: application.updatedAt,
      jobDetails: {
        id: application.jobPostingId,
        title: activeOfferRecord?.position || application.jobPosting.title,
        department: activeOfferRecord?.department || application.jobPosting.department || '',
        jobType: application.jobPosting.jobType,
        locationType: application.jobPosting.locationType || 'Onsite',
        location: activeOfferRecord?.location || application.jobPosting.location || 'Remote',
        experienceRequired: application.jobPosting.experienceRequired || 'Not specified',
        // Fixed: Added safety parsing fallbacks around Decimal type coming from postgres via Prisma
        compensationContext: activeOfferRecord 
          ? `${activeOfferRecord.currency} ${Number(activeOfferRecord.salary).toLocaleString()}`
          : application.jobPosting.salaryRange || 'Disclosed upon screening'
      },
      companyDetails: {
        name: application.jobPosting.company.name,
        logoUrl: application.jobPosting.company.logoUrl,
        industry: application.jobPosting.company.industry
      },
      resumeUsed: {
        id: application.resume.id,
        name: application.resume.name,
        downloadPath: application.resume.filePath || ''
      },
      timelineView: visualTimeline,
      interviewHistory,
      activeOffer: activeOfferRecord 
        ? {
            id: activeOfferRecord.id,
            status: activeOfferRecord.status,
            filePath: activeOfferRecord.filePath,
            sentAt: activeOfferRecord.sentAt,
            finalPosition: activeOfferRecord.position,
            finalSalary: Number(activeOfferRecord.salary), // Cast Decimal down cleanly to safe JS number
            currency: activeOfferRecord.currency,
            startDate: activeOfferRecord.startDate,
            employmentType: activeOfferRecord.employmentType
          } 
        : null,
      canWithdraw
    };

    return res.status(200).json({ success: true, data: mappedPayload });

  } catch (error) {
    console.error('Single target entity data runtime access exception crash:', error);
    return res.status(500).json({ success: false, error: 'Internal system tracking service failure' });
  }
};