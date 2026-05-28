import type { Request, Response } from "express";
import { ApplicationStatus } from "@prisma/client";
import { prisma } from "../utils/prisma.ts";

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

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: {
          status: destinationStatus as ApplicationStatus,
          pipelineIndex: typeof newIndex === 'number' ? newIndex : 0
        }
      });

      // ✅ FIXED: Changed 'ApplicationHistory' to 'applicationHistory'
      await tx.applicationHistory.create({
        data: {
          applicationId,
          status: destinationStatus as ApplicationStatus,
          notes: `Application shifted from ${sourceStatus || 'previous stage'} to ${destinationStatus} via Recruiter Workspace Kanban.`
        }
      });

      return updated;
    });

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