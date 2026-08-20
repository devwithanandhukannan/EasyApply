import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';

// ─── PLATFORM STATS ───────────────────────────────────────────────────────────

export const getPlatformStats = async (_req: Request, res: Response) => {
  try {
    const [companies, seekers, applications, subscriptions, jobs, walkinRooms] = await Promise.all([
      prisma.company.count(),
      prisma.jobSeekerProfile.count(),
      prisma.application.count(),
      prisma.companySubscription.count({ where: { isActive: true } }),
      prisma.jobPosting.count({ where: { status: 'active' } }),
      prisma.walkInRoom.count({ where: { status: 'OPEN' } }),
    ]);
    return res.json({ success: true, stats: { companies, seekers, applications, subscriptions, activeJobs: jobs, openWalkInRooms: walkinRooms } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── COMPANY MANAGEMENT ───────────────────────────────────────────────────────

export const listCompanies = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) ?? '1');
    const limit = parseInt((req.query.limit as string) ?? '20');
    const search = (req.query.search as string) ?? '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, industry: true, size: true,
          isVerified: true, verificationBadge: true, aiResumeBuilderEnabled: true, createdAt: true,
          subscription: { include: { plan: { select: { name: true, features: true } } } },
          _count: { select: { jobPostings: true, teamMembers: true } }
        }
      }),
      prisma.company.count({ where })
    ]);

    return res.json({ success: true, companies, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCompanyDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { jobPostings: true, teamMembers: true, spotJobs: true, walkInRooms: true } }
      }
    });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    return res.json({ success: true, company });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const verifyCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isVerified, verificationBadge } = req.body;
    const company = await prisma.company.update({
      where: { id },
      data: {
        isVerified: isVerified ?? true,
        verificationBadge: verificationBadge ?? 'verified'
      }
    });
    return res.json({ success: true, company });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateCompanyFeatures = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { aiResumeBuilderEnabled } = req.body;
    const updateData: any = {};
    if (typeof aiResumeBuilderEnabled === 'boolean') updateData.aiResumeBuilderEnabled = aiResumeBuilderEnabled;

    const company = await prisma.company.update({ where: { id }, data: updateData });
    return res.json({ success: true, company });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const overrideWalkInRoomMaxQueue = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { maxQueue } = req.body;

    if (typeof maxQueue !== 'number' || maxQueue < 1)
      return res.status(400).json({ success: false, message: 'maxQueue must be a positive number' });

    // Enforce global cap
    const settings = await prisma.platformSettings.findUnique({ where: { id: 'singleton' } });
    const globalMax = settings?.walkInQueueMaxGlobal ?? 200;
    if (maxQueue > globalMax)
      return res.status(400).json({ success: false, message: `maxQueue cannot exceed global platform cap of ${globalMax}` });

    const room = await prisma.walkInRoom.update({ where: { id: roomId }, data: { maxQueue } });
    return res.json({ success: true, room });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── JOB SEEKER MANAGEMENT ────────────────────────────────────────────────────

export const listSeekers = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) ?? '1');
    const limit = parseInt((req.query.limit as string) ?? '20');
    const search = (req.query.search as string) ?? '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];

    const [seekers, total] = await Promise.all([
      prisma.jobSeekerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, fullName: true, email: true, location: true,
          availabilityStatus: true, discoverable: true, aiResumeBuilderEnabled: true, createdAt: true,
          _count: { select: { applications: true, skills: true } }
        }
      }),
      prisma.jobSeekerProfile.count({ where })
    ]);

    return res.json({ success: true, seekers, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const toggleSeekerAiResumeBuilder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { aiResumeBuilderEnabled } = req.body;

    if (typeof aiResumeBuilderEnabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'aiResumeBuilderEnabled boolean is required' });
    }

    const updated = await prisma.jobSeekerProfile.update({
      where: { id },
      data: { aiResumeBuilderEnabled },
      select: { id: true, fullName: true, email: true, aiResumeBuilderEnabled: true }
    });

    return res.json({ success: true, seeker: updated });
  } catch (err) {
    console.error('toggleSeekerAiResumeBuilder error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── WALK-IN LIVE ROOMS MANAGEMENT ───────────────────────────────────────────

export const listWalkInRooms = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) ?? '1');
    const limit = parseInt((req.query.limit as string) ?? '20');
    const search = ((req.query.search as string) ?? '').trim();
    const status = (req.query.status as string) ?? 'ALL';
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { roomCode: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
        { requiredSkills: { hasSome: [search] } },
      ];
    }

    const [rooms, total, totalOpen, totalPaused, totalClosed, totalQueueEntries] = await Promise.all([
      prisma.walkInRoom.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              logo: true,
              industry: true,
            },
          },
          _count: {
            select: {
              queue: true,
            },
          },
          queue: {
            where: {
              status: { in: ['waiting', 'priority', 'interviewing'] },
            },
            select: {
              id: true,
              status: true,
              skillScore: true,
              priorityScore: true,
              waitingSince: true,
              jobSeekerProfile: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
            take: 5,
            orderBy: { priorityScore: 'desc' },
          },
        },
      }),
      prisma.walkInRoom.count({ where }),
      prisma.walkInRoom.count({ where: { status: 'OPEN' } }),
      prisma.walkInRoom.count({ where: { status: 'PAUSED' } }),
      prisma.walkInRoom.count({ where: { status: 'CLOSED' } }),
      prisma.walkInQueueEntry.count({
        where: { status: { in: ['waiting', 'priority', 'interviewing'] } },
      }),
    ]);

    return res.json({
      success: true,
      rooms,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalRooms: totalOpen + totalPaused + totalClosed,
        openRooms: totalOpen,
        pausedRooms: totalPaused,
        closedRooms: totalClosed,
        activeQueueCount: totalQueueEntries,
      },
    });
  } catch (err) {
    console.error('listWalkInRooms error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve walk-in rooms.' });
  }
};

export const updateWalkInRoomStatus = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { status } = req.body;

    if (!['OPEN', 'PAUSED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be OPEN, PAUSED, or CLOSED.' });
    }

    const room = await prisma.walkInRoom.update({
      where: { id: roomId },
      data: { status },
      include: {
        company: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.json({ success: true, message: `Room status updated to ${status}`, room });
  } catch (err) {
    console.error('updateWalkInRoomStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update walk-in room status.' });
  }
};

export const deleteWalkInRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const existing = await prisma.walkInRoom.findUnique({
      where: { id: roomId },
      select: { id: true, roomCode: true, title: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Walk-in room not found.' });
    }

    // Cascade delete room and all queue entries
    await prisma.walkInRoom.delete({
      where: { id: roomId },
    });

    return res.json({
      success: true,
      message: `Walk-in room [${existing.roomCode}] "${existing.title}" deleted successfully.`,
    });
  } catch (err) {
    console.error('deleteWalkInRoom error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete walk-in room.' });
  }
};
