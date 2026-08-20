import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';

const getProfileId = async (userId: string) => {
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return profile?.id ?? null;
};

export const toggleSaveJob = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const profileId = await getProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, message: 'Job seeker profile not found' });
    }

    const { jobPostingId } = req.params;
    if (!jobPostingId) {
      return res.status(400).json({ success: false, message: 'Job ID parameter required' });
    }

    // Verify job posting exists
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      select: { id: true, title: true },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job vacancy not found or expired' });
    }

    // Check if already saved
    const existing = await prisma.savedJob.findUnique({
      where: {
        jobSeekerProfileId_jobPostingId: {
          jobSeekerProfileId: profileId,
          jobPostingId,
        },
      },
    });

    if (existing) {
      await prisma.savedJob.delete({
        where: { id: existing.id },
      });

      return res.status(200).json({
        success: true,
        isSaved: false,
        message: 'Job removed from saved jobs',
      });
    } else {
      await prisma.savedJob.create({
        data: {
          jobSeekerProfileId: profileId,
          jobPostingId,
        },
      });

      return res.status(200).json({
        success: true,
        isSaved: true,
        message: 'Job saved successfully',
      });
    }
  } catch (error: any) {
    console.error('toggleSaveJob error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update saved job status' });
  }
};

export const getSavedJobIds = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const profileId = await getProfileId(userId);
    if (!profileId) {
      return res.status(200).json({ success: true, savedJobIds: [] });
    }

    const saved = await prisma.savedJob.findMany({
      where: { jobSeekerProfileId: profileId },
      select: { jobPostingId: true },
    });

    const savedJobIds = saved.map((s) => s.jobPostingId);
    return res.status(200).json({ success: true, savedJobIds });
  } catch (error: any) {
    console.error('getSavedJobIds error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch saved job identifiers' });
  }
};

export const getSavedJobs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const profileId = await getProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, message: 'Job seeker profile not found' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string)?.trim() || '';

    const whereCondition: any = {
      jobSeekerProfileId: profileId,
      ...(search && {
        jobPosting: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { company: { name: { contains: search, mode: 'insensitive' } } },
          ],
        },
      }),
    };

    const [total, savedEntries] = await Promise.all([
      prisma.savedJob.count({ where: whereCondition }),
      prisma.savedJob.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          jobPosting: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                  industry: true,
                  size: true,
                  verificationBadge: true,
                },
              },
              applications: {
                where: { jobSeekerProfileId: profileId },
                select: { id: true, status: true },
              },
            },
          },
        },
      }),
    ]);

    const formatted = savedEntries.map((entry) => {
      const job = entry.jobPosting;
      const application = job.applications?.[0];
      return {
        id: job.id,
        savedAt: entry.createdAt,
        title: job.title,
        department: job.department,
        jobType: job.jobType,
        locationType: job.locationType,
        location: job.location,
        salaryRange: job.salaryRange,
        experienceRequired: job.experienceRequired,
        requiredSkills: job.requiredSkills,
        deadline: job.deadline,
        openings: job.openings,
        status: job.status,
        disallowAiCv: job.disallowAiCv,
        createdAt: job.createdAt,
        company: job.company,
        hasApplied: Boolean(application),
        applicationStatus: application?.status || null,
        isSaved: true,
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('getSavedJobs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve saved jobs' });
  }
};
