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

    // Normalize today's date to midnight so jobs expiring "today" remain active
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const andConditions: any[] = [
      { status: 'active' },
      {
        OR: [
          { deadline: null },
          { deadline: { gte: todayMidnight } }, 
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

    // Extract logged-in candidate profile details if they exist
    const loggedInProfileId = (req as any).user?.jobSeekerProfileId;
    const hasSession = !!(req as any).user?.userId; // Evaluates true if user has an active session

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
          // Conditionally fetch applications only for the logged-in user
          ...(loggedInProfileId && {
            applications: {
              where: { jobSeekerProfileId: loggedInProfileId },
              select: { id: true, status: true, isWithdrawn: true },
            },
          }),
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.jobPosting.count({ where }),
    ]);

    // Format the response data payload
    const formattedJobs = jobs.map((job) => {
      // Deconstruct applications context if it was fetched
      const { applications, ...jobDetails } = job as any;
      
      let userApplicationStatus: string | false = false;

      if (loggedInProfileId && applications && applications.length > 0) {
        const app = applications[0];
        // If they haven't withdrawn, return the application's primary key ID, otherwise false
        userApplicationStatus = app.isWithdrawn ? false : app.id;
      }

      return {
        ...jobDetails,
        appliedStatus: userApplicationStatus, // 👈 Returns the application ID string, or false
      };
    });

    return res.json({
      success: true,
      isLoggedIn: hasSession,
      data: formattedJobs,
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
    const { jobId } = req.params; 
    console.log('Fetching job details for ID:', jobId);

    // Extract logged-in candidate profile details from optionalAuth middleware
    const loggedInProfileId = (req as any).user?.jobSeekerProfileId;
    
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId }, 
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
        // 1. Conditionally fetch application record only for the logged-in user
        ...(loggedInProfileId && {
          applications: {
            where: { jobSeekerProfileId: loggedInProfileId },
            select: { id: true, isWithdrawn: true },
          },
        }),
      },
    });

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // 2. Destructure applications array away and determine applied state mapping
    const { applications, ...jobDetails } = job as any;
    
    let userApplicationStatus: string | false = false;

    if (loggedInProfileId && applications && applications.length > 0) {
      const app = applications[0];
      // If they haven't withdrawn, return the application's primary key ID string
      userApplicationStatus = app.isWithdrawn ? false : app.id;
    }

    // 3. Flatten out the payload exactly how the Flutter application layout expects it
    return res.json({ 
      success: true, 
      data: {
        ...jobDetails,
        appliedStatus: userApplicationStatus // 👈 Sends Application UUID String or false
      } 
    });
  } catch (error) {
    console.error('Get job details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch job details' });
  }
};