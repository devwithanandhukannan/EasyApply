import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';

// ─── COMPANY: BROWSE DISCOVERABLE SEEKERS ────────────────────────────────────

export const listDiscoverableSeekers = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(403).json({ success: false, message: 'Company context required' });

    const page = parseInt((req.query.page as string) ?? '1');
    const limit = parseInt((req.query.limit as string) ?? '20');
    const skills = req.query.skills as string;
    const location = req.query.location as string;
    const availability = req.query.availability as string;
    const skip = (page - 1) * limit;

    const where: any = { discoverable: true };

    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (availability) where.availabilityStatus = availability;
    if (skills) {
      const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillList.length) {
        where.skills = {
          some: {
            name: { in: skillList, mode: 'insensitive' }
          }
        };
      }
    }

    const [seekers, total] = await Promise.all([
      prisma.jobSeekerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, fullName: true, profilePhotoUrl: true, location: true,
          bio: true, availabilityStatus: true, linkedin: true, github: true, portfolio: true,
          skills: { select: { name: true } },
          experience: { select: { role: true, company: true, current: true }, orderBy: { createdAt: 'desc' }, take: 2 },
          education: { select: { degree: true, institution: true }, orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { applications: true, skills: true } }
        }
      }),
      prisma.jobSeekerProfile.count({ where })
    ]);

    return res.json({ success: true, seekers, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Discovery]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── COMPANY: VIEW SEEKER PROFILE ────────────────────────────────────────────

export const getDiscoverableSeekerProfile = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(403).json({ success: false, message: 'Company context required' });

    const { profileId } = req.params;

    const seeker = await prisma.jobSeekerProfile.findFirst({
      where: { id: profileId, discoverable: true },
      include: {
        skills: true,
        experience: { orderBy: { createdAt: 'desc' } },
        education: { orderBy: { createdAt: 'desc' } },
        projects: { orderBy: { createdAt: 'desc' } },
        certifications: true,
        languages: true,
        achievements: true,
      }
    });

    if (!seeker) return res.status(404).json({ success: false, message: 'Seeker not found or not discoverable' });

    // Strip sensitive fields
    const { user, ...safeProfile } = seeker as any;
    return res.json({ success: true, seeker: safeProfile });
  } catch {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
