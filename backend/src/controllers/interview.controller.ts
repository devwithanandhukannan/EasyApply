import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';
import { ApplicationStatus, InterviewStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const getProfileId = async (userId: string): Promise<string | null> => {
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  return profile ? profile.id : null;
};

export const requestReschedule = async (req: AuthRequest, res: Response) => {
    try {
      console.log('Reachedddd');
      
        const { interviewId } = req.params;
        const { proposedTime, candidateNote } = req.body;
        const userId = req.user?.userId;

        const interview = await prisma.interview.findFirst({
            where: {
                id: interviewId,
                application: {
                    jobSeekerProfile: { userId }
                }
            }
        });

        if (!interview) {
            return res.status(404).json({ success: false, message: 'Interview not found' });
        }

        await prisma.rescheduleRequest.create({
            data: {
                interviewId,
                requestedByUserId: userId!,
                proposedTime: new Date(proposedTime),
                candidateNote,
                status: 'pending'
            }
        });

        return res.json({ success: true, message: 'Reschedule request submitted' });
    } catch (error: any) {
        console.error('Reschedule request error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
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
      selectedApplicationIds,
      targetStatus 
    } = req.body;

    if (!jobPostingId) {
      res.status(400).json({ success: false, message: "Target reference jobPostingId parameter must be explicitly passed." });
      return;
    }

    if (!selectedApplicationIds || selectedApplicationIds.length === 0) {
      res.status(400).json({ success: false, message: "No batch target application tracks specified." });
      return;
    }

    if (targetStatus !== 'technical_round' && targetStatus !== 'hr_round') {
      res.status(400).json({ 
        success: false, 
        message: "Invalid application target stage. Must be either 'technical_round' or 'hr_round'." 
      });
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
    const userId = (req as any).user?.userId || 'system';

    if (!companyId) {
      res.status(401).json({ success: false, message: "Unauthorized company session context status determined." });
      return;
    }

    const structuralFormat = (interviewFormat || 'video').toLowerCase() as any;
    const cleanInterviewerIds: string[] = interviewerIds || [];

    // ✅ FIXED: Get current status of applications before updating
    const existingApplications = await prisma.application.findMany({
      where: { id: { in: selectedApplicationIds } },
      select: { id: true, status: true }
    });

    const result = await prisma.$transaction(async (tx) => {
      
      const batch = await tx.interviewBatch.create({
        data: {
          companyId,
          jobPostingId,
          startTime: new Date(startTime),
          slotDuration: parseInt(slotDuration, 10),
          interviewFormat: structuralFormat,
          selectedCandidateIds: selectedApplicationIds,
          status: "scheduled",
          interviewers: {
            create: cleanInterviewerIds.map((teamMemberId: string) => ({
              teamMemberId: teamMemberId
            }))
          }
        }
      });

      const baseStartDate = new Date(startTime);
      const slotDurationMs = parseInt(slotDuration, 10) * 60000;

      for (let index = 0; index < selectedApplicationIds.length; index++) {
        const appId = selectedApplicationIds[index];
        const scheduledTime = new Date(baseStartDate.getTime() + index * slotDurationMs);
        const roomName = `room-${uuidv4()}`;

        // Create interview
        const interview = await tx.interview.create({
          data: {
            applicationId: appId,
            batchId: batch.id,
            scheduledTime,
            durationMinutes: parseInt(slotDuration, 10),
            format: structuralFormat,
            livekitRoomName: roomName,
            joinLink: `/meet/${roomName}`, 
            status: 'scheduled',
            interviewers: {
              create: cleanInterviewerIds.map((teamMemberId: string) => ({
                teamMemberId: teamMemberId
              }))
            }
          }
        });

        // ✅ FIXED: Find current status for this application
        const currentApp = existingApplications.find(app => app.id === appId);

        // Create history with proper schema
        await tx.applicationHistory.create({
          data: {
            applicationId: appId,
            fromStatus: currentApp?.status || null,
            toStatus: targetStatus as ApplicationStatus,
            changedBy: userId,
            changedByType: 'user',
            notes: `Interview session configured. Scheduled Date: ${scheduledTime.toLocaleString()} via live automated batching routing tools.`,
            metadata: {
              interviewId: interview.id,
              interviewFormat: structuralFormat,
              scheduledTime: scheduledTime.toISOString(),
              bulkScheduled: true,
              batchId: batch.id
            }
          }
        });

        // ✅ OPTIONAL: Create activity log if ApplicationActivity exists
        try {
          await tx.applicationActivity.create({
            data: {
              applicationId: appId,
              activityType: 'INTERVIEW_SCHEDULED',
              performedBy: userId,
              metadata: {
                interviewId: interview.id,
                scheduledTime: scheduledTime.toISOString(),
                targetStage: targetStatus
              }
            }
          });
        } catch (err) {
          // ApplicationActivity might not exist yet - safe to ignore
          console.log('Activity log skipped (table may not exist)');
        }
      }

      // Update all application statuses
      await tx.application.updateMany({
        where: { id: { in: selectedApplicationIds } },
        data: { 
          status: targetStatus as ApplicationStatus,
          pipelineIndex: 0,
          lastActivityAt: new Date() // ✅ Added if field exists
        }
      });

      return { batch };
    });

    res.status(201).json({
      success: true,
      message: `Bulk scheduled execution track generated successfully under stage: ${targetStatus}.`,
      batchId: result.batch.id
    });

  } catch (error: any) {
    console.error("Critical scheduling fault:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal runtime routing failure.", 
      error: error.message 
    });
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
            status: true,
            interviewers: {
              select: {
                teamMemberId: true,
                teamMember: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        jobSeekerProfile: {
                          select: {
                            fullName: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
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
    const userId = req.user!.userId;

    if (!proposedTime)
      return res.status(400).json({ success: false, message: 'Proposed timestamp required.' });

    const [requestLog, updatedInterview] = await prisma.$transaction([
      prisma.rescheduleRequest.create({
        data: {
          interviewId: id,
          requestedByUserId: userId,      
          proposedTime: new Date(proposedTime),
          candidateNote: candidateNote || '',
        },
      }),
      prisma.interview.update({
        where: { id },
        data: { status: 'reschedule_requested' },
      }),
    ]);

    return res.json({
      success: true,
      message: 'Reschedule request submitted.',
      data: { requestLog, updatedInterview },
    });
  } catch (error) {
    console.error('Request reschedule error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit reschedule request.' });
  }
};

// ─── 6. RESPOND TO CANDIDATE RESCHEDULE PROPOSAL (COMPANY METHOD) ───────
export const respondToReschedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; 
    const { action } = req.body; 

    if (!['approve', 'decline'].includes(action)) {
      res.status(400).json({ success: false, message: "Invalid action payload context." });
      return;
    }

    const latestRequest = await prisma.rescheduleRequest.findFirst({
      where: { interviewId: id, status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestRequest) {
      res.status(404).json({ success: false, message: "No active pending scheduling requirements located." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.rescheduleRequest.update({
        where: { id: latestRequest.id },
        data: { status: action === 'approve' ? 'approved' : 'declined' }
      });

      if (action === 'approve') {
        await tx.interview.update({
          where: { id },
          data: {
            scheduledTime: latestRequest.proposedTime,
            status: 'scheduled' 
          }
        });
      } else {
        await tx.interview.update({
          where: { id },
          data: { status: 'scheduled' }
        });
      }
    });

    res.status(200).json({ success: true, message: `Successfully responded with action: ${action}` });
  } catch (error: any) {
    console.error("Reschedule response pipeline error:", error);
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
    console.error("Pipeline manual override fault:", error);
    res.status(500).json({ success: false, message: "Failed assigning target inline manual pipeline block modifications." });
  }
};

// ─── 8. SUBMIT INTERVIEW EVALUATION FEEDBACK (COMPANY METHOD) ─────────────
export const addInterviewFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { interviewId } = req.params;
    const { technicalRating, communicationRating, problemSolvingRating, verdict, notes } = req.body;
    const userId = (req as any).user?.id || (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Missing authorized authentication token state." });
      return;
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { status: true, applicationId: true }
    });

    if (!interview) {
      res.status(404).json({ success: false, message: "Target interview record resource could not be found." });
      return;
    }

    const verifiedAssignment = await prisma.interviewInterviewer.findFirst({
      where: {
        interviewId: interviewId,
        teamMember: { userId: userId }
      }
    });

    if (!verifiedAssignment) {
      res.status(403).json({ 
        success: false, 
        message: "Access Denied: You are not registered as an assigned interviewer for this session execution pool." 
      });
      return;
    }

    const existingFeedback = await prisma.interviewFeedback.findFirst({
      where: {
        interviewId,
        interviewerId: userId
      }
    });

    if (existingFeedback) {
      res.status(409).json({ success: false, message: "Feedback metric payload already synchronized for this user node." });
      return;
    }

    const feedbackResult = await prisma.$transaction(async (tx) => {
      const feedback = await tx.interviewFeedback.create({
        data: {
          interviewId,
          interviewerId: userId,
          technicalRating: parseInt(technicalRating, 10),
          communicationRating: parseInt(communicationRating, 10),
          problemSolvingRating: parseInt(problemSolvingRating, 10),
          verdict, 
          notes: notes || ''
        }
      });

      if (interview.status !== 'completed') {
        await tx.interview.update({
          where: { id: interviewId },
          data: { status: 'completed' }
        });
      }

      return feedback;
    });

    res.status(201).json({
      success: true,
      message: "Interview evaluation performance array synchronized successfully.",
      data: feedbackResult
    });

  } catch (error: any) {
    console.error("Critical feedback commitment failure:", error);
    res.status(500).json({ success: false, message: "Internal feedback evaluation loop failure.", error: error.message });
  }
};

// ─── 9. QUERY SUBMITTED FEEDBACK RECORD RECOGNITION (DASHBOARD HUB) ──────
export const getInterviewFeedbacksList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { interviewId } = req.params;

    const feedbacks = await prisma.interviewFeedback.findMany({
      where: { interviewId },
      include: {
        interviewer: {
          select: {
            id: true,
            jobSeekerProfile: {
              select: { fullName: true }
            }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (error: any) {
    console.error("Failed compiling evaluation feedback metrics track:", error);
    res.status(500).json({ success: false, message: "Failed extracting targeted feedback elements." });
  }
};

// ─── 10. QUERY UPDATE SUBMITTED FEEDBACK RECORD ──────────────────────────
export const upsertInterviewFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { interviewId } = req.params;
    const { technicalRating, communicationRating, problemSolvingRating, verdict, notes } = req.body;
    const userId = (req as any).user?.id || (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized credentials context." });
      return;
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { applicationId: true }
    });

    if (!interview) {
      res.status(404).json({ success: false, message: "Interview target not identified." });
      return;
    }

    const existingFeedback = await prisma.interviewFeedback.findFirst({
      where: {
        interviewId,
        interviewerId: userId
      }
    });

    let feedback;

    if (existingFeedback) {
      feedback = await prisma.interviewFeedback.update({
        where: { id: existingFeedback.id },
        data: {
          technicalRating: Number(technicalRating),
          communicationRating: Number(communicationRating),
          problemSolvingRating: Number(problemSolvingRating),
          verdict,
          notes
        }
      });
    } else {
      feedback = await prisma.interviewFeedback.create({
        data: {
          interviewId,
          interviewerId: userId,
          technicalRating: Number(technicalRating),
          communicationRating: Number(communicationRating),
          problemSolvingRating: Number(problemSolvingRating),
          verdict,
          notes
        }
      });
    }

    // Automatically synchronize tracking changes back to seeker's historical audit timeline log
    let timelineLogNote = `Interviewer updated evaluation review metrics. Performance Verdict: ${verdict}.`;
    
    if (verdict === 'reject') {
  const currentApp = await prisma.application.findUnique({
    where: { id: interview.applicationId },
    select: { status: true }
  });

  await prisma.$transaction([
    prisma.interview.update({
      where: { id: interviewId },
      data: { status: 'cancelled' }
    }),
    prisma.application.update({
      where: { id: interview.applicationId },
      data: { status: ApplicationStatus.rejected }
    }),
    prisma.applicationHistory.create({
      data: {
        applicationId: interview.applicationId,
        fromStatus: currentApp?.status || null,
        toStatus: ApplicationStatus.rejected,
        changedBy: userId,
        changedByType: 'user',
        notes: 'Application moved to rejected stage following panel interview performance evaluations.'
      }
    })
  ]);
} else if (verdict === 'shortlist' || verdict === 'next_round') {
  const currentApp = await prisma.application.findUnique({
    where: { id: interview.applicationId },
    select: { status: true }
  });

  const newStatus = verdict === 'shortlist' ? ApplicationStatus.screened : ApplicationStatus.technical_round;

  await prisma.$transaction([
    prisma.interview.update({
      where: { id: interviewId },
      data: { status: 'completed' }
    }),
    prisma.applicationHistory.create({
      data: {
        applicationId: interview.applicationId,
        fromStatus: currentApp?.status || null,
        toStatus: newStatus,
        changedBy: userId,
        changedByType: 'user',
        notes: timelineLogNote
      }
    })
  ]);
}

    res.status(200).json({
      success: true,
      message: "Feedback payload synchronized cleanly to repository ledger.",
      data: feedback
    });

  } catch (error: any) {
    console.error("Critical breakdown tracking feedback payload:", error);
    res.status(500).json({ success: false, message: "Internal update failure.", error: error.message });
  }
};