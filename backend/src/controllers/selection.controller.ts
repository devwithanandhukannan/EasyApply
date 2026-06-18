import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';
import { ApplicationStatus, ActivityType } from '@prisma/client';

interface AuthRequest extends Request {
  user?: { userId: string };
  company?: { companyId: string };
}

const DIRECT_STATUSES: ApplicationStatus[] = [
  'applied',
  'screened',
  'offer_sent',
  'hired',
  'rejected',
];

export const bulkUpdateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicationIds, targetStatus } = req.body;

    if (!applicationIds || applicationIds.length === 0) {
      res.status(400).json({ success: false, message: 'No applications selected.' });
      return;
    }

    if (!DIRECT_STATUSES.includes(targetStatus)) {
      res.status(400).json({
        success: false,
        message: `targetStatus must be one of: ${DIRECT_STATUSES.join(', ')}. For technical_round or hr_round, use the bulk-schedule endpoint.`,
      });
      return;
    }

    const companyId = (req as any).company?.companyId;
    const userId = (req as any).user?.userId ?? 'system';

    // Verify all applications belong to this company
    const applications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        jobPosting: { companyId },
      },
      select: { id: true, status: true },
    });

    if (applications.length !== applicationIds.length) {
      res.status(403).json({ success: false, message: 'One or more applications not found or not authorized.' });
      return;
    }

    await prisma.$transaction([
      prisma.application.updateMany({
        where: { id: { in: applicationIds } },
        data: {
          status: targetStatus as ApplicationStatus,
          lastActivityAt: new Date(),
        },
      }),
      ...applications.map((app) =>
        prisma.applicationHistory.create({
          data: {
            applicationId: app.id,
            fromStatus: app.status,
            toStatus: targetStatus as ApplicationStatus,
            changedBy: userId,
            changedByType: 'user',
            notes: `Bulk status update to ${targetStatus}.`,
          },
        })
      ),
    ]);

    res.status(200).json({
      success: true,
      message: `${applications.length} applications updated to "${targetStatus}".`,
    });
  } catch (error: any) {
    console.error('bulkUpdateApplicationStatus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── BULK STATUS TRANSITION (Selection) ────────────────────────────

export const bulkMoveApplications = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    const userId = req.user?.userId;
    
    if (!companyId || !userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { 
      applicationIds, 
      targetStatus, 
      notes 
    } = req.body;

    if (!applicationIds || applicationIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No applications selected' 
      });
    }

    if (!targetStatus) {
      return res.status(400).json({ 
        success: false, 
        message: 'Target status required' 
      });
    }

    // Verify all applications belong to this company
    const applications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        jobPosting: { companyId }
      },
      select: {
        id: true,
        status: true
      }
    });

    if (applications.length !== applicationIds.length) {
      return res.status(403).json({ 
        success: false, 
        message: 'Some applications do not belong to your company' 
      });
    }

    // Perform bulk update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update all applications
      await tx.application.updateMany({
        where: { id: { in: applicationIds } },
        data: {
          status: targetStatus as ApplicationStatus,
          lastActivityAt: new Date()
        }
      });

      // Create history entries for each
      const historyEntries = applications.map(app => ({
        applicationId: app.id,
        fromStatus: app.status,
        toStatus: targetStatus as ApplicationStatus,
        changedBy: userId,
        changedByType: 'user',
        notes: notes || `Bulk moved to ${targetStatus}`,
        metadata: {
          bulkOperation: true,
          totalInBatch: applicationIds.length
        }
      }));

      await tx.applicationHistory.createMany({
        data: historyEntries
      });

      // Create activity logs
      const activityEntries = applications.map(app => ({
        applicationId: app.id,
        activityType: 'STATUS_CHANGED' as ActivityType,
        performedBy: userId,
        metadata: {
          from: app.status,
          to: targetStatus,
          reason: notes || 'Bulk selection'
        }
      }));

      await tx.applicationActivity.createMany({
        data: activityEntries
      });

      return {
        updated: applications.length,
        targetStatus
      };
    });

    return res.json({ 
      success: true, 
      message: `${result.updated} candidates moved to ${result.targetStatus}`,
      data: result
    });

  } catch (error: any) {
    console.error('Bulk move error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── STAR/UNSTAR CANDIDATES ────────────────────────────────────────


export const bulkStarApplications = async (req: any, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    const userId = req.user?.userId;
    
    if (!companyId || !userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { applicationIds, starred } = req.body;

    if (!applicationIds || applicationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No applications provided' });
    }

    // 1. Fetch the applications to verify ownership AND extract their jobSeekerProfileId values
    const apps = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        jobPosting: { companyId }
      },
      select: {
        id: true,
        jobSeekerProfileId: true
      }
    });

    if (apps.length !== applicationIds.length) {
      return res.status(403).json({ success: false, message: 'Invalid applications' });
    }

    const seekerProfileIds = apps.map(app => app.jobSeekerProfileId);

    await prisma.$transaction(async (tx) => {
      // 2. Update the CRM data on the CORRECT model (CompanyCandidateProfile)
      await tx.companyCandidateProfile.updateMany({
        where: {
          companyId,
          jobSeekerProfileId: { in: seekerProfileIds }
        },
        data: {
          isStarred: starred,
          // note: if you need tracked tracking dates/users like starredBy, 
          // ensure they exist on CompanyCandidateProfile or store them inside JSON meta
          updatedAt: new Date() 
        }
      });

      // 3. Update the last activity timestamp on the applications themselves
      await tx.application.updateMany({
        where: { id: { in: applicationIds } },
        data: {
          lastActivityAt: new Date()
        }
      });

      // 4. Create the activity logs
      const activities = applicationIds.map((appId: string) => ({
        applicationId: appId,
        activityType: (starred ? 'STARRED' : 'UNSTARRED') as ActivityType,
        performedBy: userId,
        metadata: {
          timestamp: new Date().toISOString()
        }
      }));

      await tx.applicationActivity.createMany({
        data: activities
      });
    });

    return res.json({ 
      success: true, 
      message: `${applicationIds.length} candidates ${starred ? 'starred' : 'unstarred'}`
    });

  } catch (error: any) {
    console.error('Bulk star error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// ─── SET PRIORITY ──────────────────────────────────────────────────

export const bulkSetPriority = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    const userId = req.user?.userId;
    
    if (!companyId || !userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { applicationIds, priority } = req.body;

    if (priority && ![1, 2, 3].includes(priority)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Priority must be 1 (High), 2 (Medium), or 3 (Low)' 
      });
    }

    const count = await prisma.application.count({
      where: {
        id: { in: applicationIds },
        jobPosting: { companyId }
      }
    });

    if (count !== applicationIds.length) {
      return res.status(403).json({ success: false, message: 'Invalid applications' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.application.updateMany({
        where: { id: { in: applicationIds } },
        data: {
          priority,
          prioritySetAt: priority ? new Date() : null,
          prioritySetBy: priority ? userId : null,
          lastActivityAt: new Date()
        }
      });

      const activities = applicationIds.map((appId: string) => ({
        applicationId: appId,
        activityType: priority ? 'PRIORITY_SET' : 'PRIORITY_CLEARED' as ActivityType,
        performedBy: userId,
        metadata: { priority }
      }));

      await tx.applicationActivity.createMany({
        data: activities
      });
    });

    return res.json({ 
      success: true, 
      message: `Priority ${priority ? 'set to ' + priority : 'cleared'} for ${applicationIds.length} candidates`
    });

  } catch (error: any) {
    console.error('Bulk priority error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADD/REMOVE TAGS ──────────────────────────────────────────────

export const bulkAddTags = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    const userId = req.user?.userId;
    
    const { applicationIds, tags } = req.body;

    const applications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        jobPosting: { companyId }
      },
      select: { id: true, tags: true }
    });

    await prisma.$transaction(async (tx) => {
      for (const app of applications) {
        const newTags = Array.from(new Set([...app.tags, ...tags]));
        
        await tx.application.update({
          where: { id: app.id },
          data: { 
            tags: newTags,
            lastActivityAt: new Date()
          }
        });

        await tx.applicationActivity.create({
          data: {
            applicationId: app.id,
            activityType: 'TAG_ADDED',
            performedBy: userId!,
            metadata: { addedTags: tags }
          }
        });
      }
    });

    return res.json({ success: true, message: 'Tags added successfully' });

  } catch (error: any) {
    console.error('Add tags error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET APPLICATIONS WITH FILTERS ────────────────────────────────

export const getFilteredApplications = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    const { jobPostingId } = req.params;
    
    const {
      status,
      starred,
      priority,
      tags,
      search,
      limit = '20',
      page = '1'
    } = req.query;

    const where: any = {
      jobPostingId,
      jobPosting: { companyId }
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (starred === 'true') {
      where.isStarred = true;
    }

    if (priority) {
      where.priority = parseInt(priority as string);
    }

    if (tags) {
      where.tags = {
        hasSome: Array.isArray(tags) ? tags : [tags]
      };
    }

    if (search) {
      where.OR = [
        { jobSeekerProfile: { fullName: { contains: search as string, mode: 'insensitive' } } },
        { jobSeekerProfile: { email: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          jobSeekerProfile: {
            select: {
              fullName: true,
              email: true,
              phone: true,
              profilePhotoUrl: true,
              location: true
            }
          },
          resume: {
            select: {
              name: true,
              atsScore: true
            }
          },
          interviews: {
            select: { status: true },
            orderBy: { scheduledTime: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { isStarred: 'desc' },
          { priority: 'asc' },
          { lastActivityAt: 'desc' }
        ],
        skip,
        take
      }),
      prisma.application.count({ where })
    ]);

    return res.json({
      success: true,
      data: applications,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });

  } catch (error: any) {
    console.error('Filter applications error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SINGLE APPLICATION DETAILS ────────────────────────────────

export const getApplicationDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const companyId = req.company?.companyId;

    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        jobPosting: { companyId }
      },
      include: {
        jobSeekerProfile: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            profilePhotoUrl: true,
            location: true
          }
        },
        resume: {
          select: {
            id: true,
            name: true,
            filePath: true,
            atsScore: true
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: true,
            company: {
              select: {
                name: true,
                logoUrl: true
              }
            }
          }
        },
        interviews: {
          select: {
            id: true,
            scheduledTime: true,
            status: true
          },
          orderBy: { scheduledTime: 'desc' },
          take: 1
        }
      }
    });

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found or does not belong to your company' 
      });
    }

    return res.json({
      success: true,
      data: application
    });

  } catch (error: any) {
    console.error('Get application details error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── GET ACTIVITY TIMELINE ────────────────────────────────────────

export const getApplicationTimeline = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const companyId = req.company?.companyId;

    // Verify ownership
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        jobPosting: { companyId }
      }
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Get complete timeline
    const [history, activities] = await Promise.all([
      prisma.applicationHistory.findMany({
        where: { applicationId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.applicationActivity.findMany({
        where: { applicationId },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    return res.json({
      success: true,
      data: {
        statusHistory: history,
        recentActivity: activities
      }
    });

  } catch (error: any) {
    console.error('Timeline error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};