
import type { Request, Response } from "express";
import { ApplicationStatus } from "@prisma/client";
import { prisma } from "../utils/prisma.ts";
import { NotificationService } from '../services/notification.service.ts';

export const getPipelineBoard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { jobPostingId } = req.params;
        
        const applications = await prisma.application.findMany({
            where: { jobPostingId },
            include: {
                jobSeekerProfile: {
                    select: {
                        fullName: true,
                        email: true,
                        profilePhotoUrl: true,
                        phone: true
                    }
                },
                interviews: {
                    orderBy: { scheduledTime: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        scheduledTime: true,
                        status: true,
                        format: true
                    }
                }
            }, 
            orderBy: { pipelineIndex: 'asc' }
        });

        const board: Record<ApplicationStatus, any[]> = {
            applied: [],
            screened: [],
            technical_round: [],
            hr_round: [],
            offer_sent: [],
            hired: [],
            rejected: []
        };

        applications.forEach(app => {
            if (board[app.status]) {
                board[app.status].push(app);
            }
        });

        res.status(200).json({ 'success': true, 'data': board });

    } catch (error: any) {
        console.error("Error fetching Kanban board:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const movePipelineCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicationId, jobPostingId, sourceStatus, destinationStatus, newIndex } = req.body;

    if (!applicationId || !destinationStatus) {
      res.status(400).json({ success: false, message: "Missing required core coordination indices." });
      return;
    }

    // 1. ഫെച്ച് ചെയ്യുമ്പോൾ യൂസർ റിലേഷനും കാൻഡിഡേറ്റ് പ്രൊഫൈൽ റിലേഷനും ഒരുമിച്ച് എടുക്കുന്നു
    const currentApp = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { 
        status: true,
        jobSeekerProfile: {
          select: { 
            userId: true, 
            fullName: true,
            user: {
              select: {
                // പുതിയ മൈഗ്രേഷൻ അനുസരിച്ച് യൂസർ ടേബിളിൽ ഉണ്ടെങ്കിൽ അതും ബാക്കപ്പ് ആയി എടുക്കുന്നു
                mobileNumber: true
              }
            }
          }
        },
        jobPosting: {
          select: { title: true }
        }
      }
    });

    const userId = (req as any).user?.userId || 'system';

    const result = await prisma.$transaction(async (tx) => {
      // Status & Index അപ്ഡേറ്റ് ചെയ്യുന്നു
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: {
          status: destinationStatus as ApplicationStatus,
          pipelineIndex: typeof newIndex === 'number' ? newIndex : 0,
          lastActivityAt: new Date()
        }
      });

      // ഹിസ്റ്ററി ലോഗ് ട്രാക്ക് ചെയ്യുന്നു
      await tx.applicationHistory.create({
        data: {
          applicationId,
          fromStatus: currentApp?.status || sourceStatus as ApplicationStatus || null,
          toStatus: destinationStatus as ApplicationStatus,
          changedBy: userId,
          changedByType: 'user',
          notes: `Application shifted from ${sourceStatus || currentApp?.status || 'previous stage'} to ${destinationStatus} via Recruiter Workspace Kanban.`,
          metadata: {
            sourceStatus: sourceStatus || currentApp?.status,
            destinationStatus,
            pipelineIndex: newIndex,
            movedVia: 'kanban_drag_drop'
          }
        }
      });

      // ആക്റ്റിവിറ്റി ലോഗ് ക്രിയേറ്റ് ചെയ്യുന്നു
      try {
        await tx.applicationActivity.create({
          data: {
            applicationId,
            activityType: 'STATUS_CHANGED',
            performedBy: userId,
            metadata: {
              from: sourceStatus || currentApp?.status,
              to: destinationStatus,
              method: 'kanban_board',
              newIndex
            }
          }
        });
      } catch (err) {
        console.log('Activity log skipped');
      }

      return updated;
    });

    // 2. ⚡ FCM Push Notification Dispatcher
    const targetUserId = currentApp?.jobSeekerProfile?.userId;
    if (targetUserId && currentApp.status !== destinationStatus) {
      // അണ്ടർസ്കോറുകൾ മാറ്റി ക്ലീൻ ഫോർമാറ്റിലേക്ക് മാറ്റുന്നു (e.g., technical_round -> Technical Round)
      const stageName = destinationStatus.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase());
      const jobTitle = currentApp.jobPosting?.title || "your applied position";
      
      // പുതിയ മൈഗ്രേഷൻ പ്രകാരം യൂസറുടെ പേര് കണ്ടെത്തുന്നു
      const candidateName = currentApp.jobSeekerProfile?.fullName || "Candidate";

      const notificationTitle = `Application Update! 🚀`;
      const notificationBody = `Hi ${candidateName}, your application for "${jobTitle}" has progressed to: ${stageName}.`;
      const dashboardLink = `http://localhost:3000/dashboard/applications`;

      // നോട്ടിഫിക്കേഷൻ ബാക്ക്ഗ്രൗണ്ടിൽ എക്സിക്യൂട്ട് ചെയ്യുന്നു
      NotificationService.sendToUser(
        targetUserId,
        notificationTitle,
        notificationBody,
        dashboardLink
      ).catch((fcmError) => {
        // ഡാറ്റാബേസിൽ ടോക്കൺ ഇല്ലാത്ത അവസ്ഥയോ ഫയർബേസ് നെറ്റ്‌വർക്ക് ഇഷ്യൂവോ വന്നാൽ ഇവിടെ ലോഗ് ചെയ്യും
        console.log(`[FCM Bypass] Device messaging suspended for ${targetUserId}: ${fcmError.message}`);
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Candidate tracked location position vector successfully modified with timeline logging entries sync.",
      data: result 
    });

  } catch (error: any) {
    console.error("Error shifting Kanban pipeline node:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};