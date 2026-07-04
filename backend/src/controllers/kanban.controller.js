import { ApplicationStatus } from "@prisma/client";
import { prisma } from "../utils/prisma.ts";
import { NotificationService } from '../services/notification.service.ts';
export const getPipelineBoard = async (req, res) => {
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
        const board = {
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
    }
    catch (error) {
        console.error("Error fetching Kanban board:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const movePipelineCard = async (req, res) => {
    try {
        const { applicationId, jobPostingId, sourceStatus, destinationStatus, newIndex } = req.body;
        if (!applicationId || !destinationStatus) {
            res.status(400).json({ success: false, message: "Missing required core coordination indices." });
            return;
        }
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
        const userId = req.user?.userId || 'system';
        const result = await prisma.$transaction(async (tx) => {
            // Status & Index അപ്ഡേറ്റ് ചെയ്യുന്നു
            const updated = await tx.application.update({
                where: { id: applicationId },
                data: {
                    status: destinationStatus,
                    pipelineIndex: typeof newIndex === 'number' ? newIndex : 0,
                    lastActivityAt: new Date()
                }
            });
            await tx.applicationHistory.create({
                data: {
                    applicationId,
                    fromStatus: currentApp?.status || sourceStatus || null,
                    toStatus: destinationStatus,
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
            }
            catch (err) {
                console.log('Activity log skipped');
            }
            return updated;
        });
        const targetUserId = currentApp?.jobSeekerProfile?.userId;
        if (targetUserId && currentApp.status !== destinationStatus) {
            const stageName = destinationStatus.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
            const jobTitle = currentApp.jobPosting?.title || "your applied position";
            const candidateName = currentApp.jobSeekerProfile?.fullName || "Candidate";
            const notificationTitle = `Application Update!`;
            const notificationBody = `Hi ${candidateName}, your application for "${jobTitle}" has progressed to: ${stageName}.`;
            const dashboardLink = `http://localhost:3000/dashboard/applications`;
            NotificationService.sendToUser(targetUserId, notificationTitle, notificationBody, dashboardLink).catch((fcmError) => {
                console.log(`[FCM Bypass] Device messaging suspended for ${targetUserId}: ${fcmError.message}`);
            });
        }
        res.status(200).json({
            success: true,
            message: "Candidate tracked location position vector successfully modified with timeline logging entries sync.",
            data: result
        });
    }
    catch (error) {
        console.error("Error shifting Kanban pipeline node:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
//# sourceMappingURL=kanban.controller.js.map