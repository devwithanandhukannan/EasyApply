import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';

export const getPublicJobs = async (req: Request, res: Response) => {
  try {
    const {
      search,
      jobType,
      locationType,
      location,
      companyId,
      limit = '20',
      page = '1',
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // FIX: Normalize today's date to midnight so jobs expiring "today" remain active
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const andConditions: any[] = [
      { status: 'active' },
      {
        OR: [
          { deadline: null },
          { deadline: { gte: todayMidnight } }, // Compares cleanly against the start of the day
        ],
      },
    ];

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search as string, mode: 'insensitive' } },
          { department: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ],
      });
    }

    if (jobType && jobType !== 'all') andConditions.push({ jobType });
    if (locationType && locationType !== 'all') andConditions.push({ locationType });
    if (location) andConditions.push({ location: { contains: location as string, mode: 'insensitive' } });
    if (companyId) andConditions.push({ companyId });

    const where = { AND: andConditions };

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
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
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.jobPosting.count({ where }),
    ]);

    return res.json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Get public jobs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
};
export const getPublicJobDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.jobPosting.findUnique({
      where: { id },
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
        _count: { select: { applications: true } },
      },
    });

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    return res.json({ success: true, data: job });
  } catch (error) {
    console.error('Get job details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch job details' });
  }
};