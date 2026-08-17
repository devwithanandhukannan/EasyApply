import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';

// ─── COMPANY: BROWSE DISCOVERABLE SEEKERS ────────────────────────────────────

export const listDiscoverableSeekers = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(403).json({ success: false, message: 'Company context required' });

    const page = parseInt((req.query.page as string) ?? '1');
    const limit = parseInt((req.query.limit as string) ?? '20');
    const search = (req.query.search as string)?.trim();
    const skills = req.query.skills as string;
    const location = (req.query.location as string)?.trim();
    const availability = req.query.availability as string;
    const experienceLevel = req.query.experience as string;
    const skip = (page - 1) * limit;

    const andConditions: any[] = [
      { discoverable: true }
    ];

    // General text search (name, bio, location, or email)
    if (search) {
      andConditions.push({
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { bio: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          {
            skills: {
              some: {
                name: { contains: search, mode: 'insensitive' }
              }
            }
          },
          {
            experience: {
              some: {
                OR: [
                  { role: { contains: search, mode: 'insensitive' } },
                  { company: { contains: search, mode: 'insensitive' } }
                ]
              }
            }
          }
        ]
      });
    }

    if (location) {
      andConditions.push({
        location: { contains: location, mode: 'insensitive' }
      });
    }

    if (availability) {
      andConditions.push({
        availabilityStatus: availability
      });
    }

    // Skills array filter (matches any or all of the provided skills)
    if (skills) {
      const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillList.length > 0) {
        andConditions.push({
          OR: skillList.map(skill => ({
            skills: {
              some: {
                name: { contains: skill, mode: 'insensitive' }
              }
            }
          }))
        });
      }
    }

    // Experience level filter
    if (experienceLevel) {
      if (experienceLevel === 'experienced') {
        andConditions.push({
          experience: { some: {} }
        });
      } else if (experienceLevel === 'fresher' || experienceLevel === 'entry') {
        // Entry or fresher
      } else if (experienceLevel === 'mid' || experienceLevel === 'senior') {
        andConditions.push({
          experience: { some: {} }
        });
      }
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

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
          experience: {
            select: { role: true, company: true, current: true, startYear: true, endYear: true },
            orderBy: { createdAt: 'desc' },
            take: 3
          },
          education: {
            select: { degree: true, institution: true, startYear: true, endYear: true },
            orderBy: { createdAt: 'desc' },
            take: 2
          },
          _count: { select: { applications: true, skills: true, experience: true } }
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

    if (!seeker) return res.status(404).json({ success: false, message: 'Seeker profile not found' });

    // Strip sensitive fields
    const { user, ...safeProfile } = seeker as any;
    return res.json({ success: true, seeker: safeProfile });
  } catch {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
