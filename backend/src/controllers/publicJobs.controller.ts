// src/controllers/publicJobs.controller.ts
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

    const where: any = { status: 'active' };

    // Search in title, department, description
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { department: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Filter by job type
    if (jobType && jobType !== 'all') {
      where.jobType = jobType;
    }

    // Filter by location type
    if (locationType && locationType !== 'all') {
      where.locationType = locationType;
    }

    // Filter by city location
    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    // Filter by company
    if (companyId) {
      where.companyId = companyId;
    }

    // Only show jobs with future or no deadline
    where.OR = [
      { deadline: null },
      { deadline: { gte: new Date() } }
    ];

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
            }
          },
          _count: {
            select: {
              applications: true,
            }
          }
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
      }
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
          }
        },
        _count: {
          select: {
            applications: true,
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    return res.json({ success: true, data: job });
  } catch (error) {
    console.error('Get job details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch job details' });
  }
};