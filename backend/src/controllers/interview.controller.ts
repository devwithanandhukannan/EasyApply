import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';
import { InterviewFormat, InterviewStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Helper to look up job seeker profile identifier safely
const getProfileId = async (userId: string): Promise<string | null> => {
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  return profile ? profile.id : null;
};

// ─── 1. BULK GENERATION ENGINE (COMPANY WORKSPACE) ──────────────────────
export const scheduleBulkInterviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      jobPostingId, 
      startTime, 
      slotDuration, 
      interviewFormat, 
      interviewerIds, 
      selectedApplicationIds 
    } = req.body;

    if (!jobPostingId) {
      res.status(400).json({ success: false, message: "Target reference jobPostingId parameter must be explicitly passed." });
      return;
    }

    if (!selectedApplicationIds || selectedApplicationIds.length === 0) {
      res.status(400).json({ success: false, message: "No batch target application tracks specified." });
      return;
    }

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      select: { companyId: true }
    });

    if (!jobPosting) {
      res.status(404).json({ success: false, message: "The referenced job posting records could not be found." });
      return;
    }

    const companyId = (req as any).company?.companyId || (req as any).user?.company?.id || jobPosting.companyId; 
    if (!companyId) {
      res.status(401).json({ success: false, message: "Unauthorized company session context status determined." });
      return;
    }

    const structuralFormat = (interviewFormat || 'video').toLowerCase() as InterviewFormat;

    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.interviewBatch.create({
        data: {
          companyId,
          jobPostingId,
          startTime: new Date(startTime),
          slotDuration: parseInt(slotDuration, 10),
          interviewFormat: structuralFormat,
          interviewerIds: interviewerIds || [],
          selectedCandidateIds: selectedApplicationIds,
          status: "scheduled"
        }
      });

      const baseStartDate = new Date(startTime);
      const interviewPromises = selectedApplicationIds.map((appId: string, index: number) => {
        const scheduledTime = new Date(baseStartDate.getTime() + index * parseInt(slotDuration, 10) * 60000);
        const roomName = `room-${uuidv4()}`;

        return tx.interview.create({
          data: {
            applicationId: appId,
            batchId: batch.id,
            scheduledTime,
            durationMinutes: parseInt(slotDuration, 10),
            format: structuralFormat,
            interviewerIds: interviewerIds || [],
            livekitRoomName: roomName,
            joinLink: `/meet/${roomName}`,
            status: InterviewStatus.scheduled
          }
        });
      });

      await Promise.all(interviewPromises);

      await tx.application.updateMany({
        where: { id: { in: selectedApplicationIds } },
        data: { status: 'interview' }
      });

      return { batch };
    });

    res.status(201).json({
      success: true,
      message: `Bulk scheduled execution track generated successfully.`,
      batchId: result.batch.id
    });

  } catch (error: any) {
    console.error("Critical scheduling fault:", error);
    res.status(500).json({ success: false, message: "Internal runtime routing failure.", error: error.message });
  }
};

// ─── 2. PIPELINE INTERVIEW QUEUE LISTER (COMPANY DASHBOARD) ──────────────
export const getCompanyInterviewsList = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).company?.companyId;
    
    if (!companyId) {
      res.status(401).json({ 
        success: false, 
        message: "Unauthorized access: Missing structural company session token context." 
      });
      return;
    }

    const interviews = await prisma.interview.findMany({
      where: {
        batch: {
          companyId: companyId
        }
      },
      select: {
        id: true,
        scheduledTime: true,
        durationMinutes: true,
        format: true,
        status: true,
        livekitRoomName: true,
        joinLink: true,
        
        rescheduleRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            proposedTime: true,
            candidateNote: true,
            status: true,
            createdAt: true
          }
        },
        
        application: {
          select: {
            id: true,
            status: true,
            appliedAt: true,
            jobSeekerProfile: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                location: true,
                profilePhotoUrl: true
              }
            },
            jobPosting: {
              select: {
                id: true,
                title: true,
                department: true,
                jobType: true,
                locationType: true,
                salaryRange: true,
                openings: true,
                description: true,
                requiredSkills: true
              }
            },
            resume: {
              select: {
                id: true,
                name: true,
                filePath: true,
                atsScore: true
              }
            }
          }
        },
        batch: {
          select: {
            id: true,
            interviewerIds: true,
            status: true
          }
        }
      },
      orderBy: {
        scheduledTime: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews
    });

  } catch (error: any) {
    console.error("Failed compiling company pipeline interview context records:", error);
    res.status(500).json({ success: false, message: "Internal runtime server pipeline evaluation failure.", error: error.message });
  }
};

// ─── 3. EXTRACT TARGET ALLOCATIONS (JOB SEEKER PIPELINE Hub) ────────────
export const getMyScheduledInterviews = async (req: Request, res: Response) => {
  try { 
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    
    if (!profileId) {
      return res.status(404).json({ success: false, message: 'Job seeker profile workspace not found.' });
    }
    
    const interviews = await prisma.interview.findMany({
      where: {
        application: {
          jobSeekerProfileId: profileId
        }
      },
      include: {
        application: {
          include: {
            jobPosting: {
              include: {
                company: {
                  select: {
                    name: true,
                    logoUrl: true
                  }
                }
              }
            }
          }
        },
        rescheduleRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { scheduledTime: 'asc' }
    });

    return res.json({
      success: true,
      data: interviews
    });

  } catch (error: any) {
    console.error('Fetch jobseeker interviews tracking exception:', error);
    return res.status(500).json({ success: false, message: 'Failed to extract active pipeline slots.' });
  }
};

// ─── 4. CONFIRM SCHEDULING INTERFACE ACTION (JOB SEEKER METHOD) ─────────
export const confirmInterviewPresence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: { status: 'confirmed' }
    });

    return res.json({
      success: true,
      message: 'Interview slot presence confirmed successfully.',
      data: updatedInterview
    });
  } catch (error) {
    console.error('Confirm interview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update schedule allocation status.' });
  }
};

// ─── 5. DISPATCH RESCHEDULE REQUEST PARAMETERS (JOB SEEKER METHOD) ──────
export const requestInterviewReschedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { proposedTime, candidateNote } = req.body;

    if (!proposedTime) {
      return res.status(400).json({ success: false, message: 'Please provide a valid alternate proposed timestamp.' });
    }

    const [requestLog, updatedInterview] = await prisma.$transaction([
      prisma.rescheduleRequest.create({
        data: {
          interviewId: id,
          requestedBy: 'job_seeker',
          proposedTime: new Date(proposedTime),
          candidateNote: candidateNote || ''
        }
      }),
      prisma.interview.update({
        where: { id },
        data: { status: 'reschedule_requested' }
      })
    ]);

    return res.json({
      success: true,
      message: 'Reschedule request submitted successfully to structural company workspace.',
      data: { requestLog, updatedInterview }
    });
  } catch (error) {
    console.error('Request reschedule pipeline failure:', error);
    return res.status(500).json({ success: false, message: 'Failed to dispatch allocation transaction.' });
  }
};

// ─── 6. RESPOND TO CANDIDATE RESCHEDULE PROPOSAL (COMPANY METHOD) ───────
export const respondToReschedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Interview ID
    const { action } = req.body; // 'approve' | 'decline'

    if (!['approve', 'decline'].includes(action)) {
      res.status(400).json({ success: false, message: "Invalid action payload context." });
      return;
    }

    // Pull current latest pending request track matching this target element
    const latestRequest = await prisma.rescheduleRequest.findFirst({
      where: { interviewId: id, status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestRequest) {
      res.status(404).json({ success: false, message: "No active pending scheduling requirements located." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Update historical trace document item status log details 
      await tx.rescheduleRequest.update({
        where: { id: latestRequest.id },
        data: { status: action === 'approve' ? 'approved' : 'declined' }
      });

      // If approved, forcefully rewrite master calendar entry records block
      if (action === 'approve') {
        await tx.interview.update({
          where: { id },
          data: {
            scheduledTime: latestRequest.proposedTime,
            status: 'scheduled' // Reset structural target log loop back to scheduled state
          }
        });
      } else {
        // If rejected, keep previous time and safely step status tag back down
        await tx.interview.update({
          where: { id },
          data: { status: 'scheduled' }
        });
      }
    });

    res.status(200).json({ success: true, message: `Successfully responded with action: ${action}` });
  } catch (error: any) {
    console.error("Reschedule response pipeline loop trace tracking error:", error);
    res.status(500).json({ success: false, message: "Failed adjusting profile scheduling requirements workflow records." });
  }
};

// ─── 7. FORCE UPDATE INTERVIEW STATUS MANUALLY (COMPANY METHOD) ─────────
export const updateInterviewStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.interview.update({
      where: { id },
      data: { status: status as InterviewStatus }
    });

    res.status(200).json({ success: true, message: "Structural system status tracking trace updated successfully.", data: updated });
  } catch (error: any) {
    console.error("Pipeline manual override handler fault context trace:", error);
    res.status(500).json({ success: false, message: "Failed assigning target inline manual pipeline block modifications." });
  }
};