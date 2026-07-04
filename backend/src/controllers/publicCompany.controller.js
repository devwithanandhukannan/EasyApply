import { prisma } from '../utils/prisma.ts';
// ─────────────────────────────────────────────────────────────────────
// GET PUBLIC COMPANY PROFILE BY SLUG/ID
// ─────────────────────────────────────────────────────────────────────
export const getPublicCompanyProfile = async (req, res) => {
    try {
        const { identifier } = req.params;
        let company = await prisma.company.findUnique({
            where: { id: identifier },
            select: {
                id: true,
                name: true,
                logoUrl: true,
                industry: true,
                size: true,
                tagline: true,
                services: true,
                products: true,
                seoKeywords: true,
                coreValues: true,
                gallery: true,
                youtubeLink: true,
                officeLocations: true,
                socialMedia: true,
                corporateLink: true,
                verificationBadge: true,
                isVerified: true,
                createdAt: true,
                _count: {
                    select: {
                        jobPostings: { where: { status: 'active' } },
                        teamMembers: { where: { status: 'active' } }
                    }
                }
            }
        });
        if (!company) {
            const slugToName = identifier.split('-').join(' ');
            company = await prisma.company.findFirst({
                where: { name: { equals: slugToName, mode: 'insensitive' } },
                select: {
                    id: true,
                    name: true,
                    logoUrl: true,
                    industry: true,
                    size: true,
                    tagline: true,
                    services: true,
                    products: true,
                    seoKeywords: true,
                    coreValues: true,
                    gallery: true,
                    youtubeLink: true,
                    officeLocations: true,
                    socialMedia: true,
                    corporateLink: true,
                    verificationBadge: true,
                    isVerified: true,
                    createdAt: true,
                    _count: {
                        select: {
                            jobPostings: { where: { status: 'active' } },
                            teamMembers: { where: { status: 'active' } }
                        }
                    }
                }
            });
        }
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found.' });
        }
        const sanitized = {
            ...company,
            services: company.services || [],
            seoKeywords: company.seoKeywords || [],
            coreValues: company.coreValues || [],
            gallery: company.gallery || [],
            products: company.products || {},
            officeLocations: company.officeLocations || [],
            socialMedia: company.socialMedia || {},
            activeJobsCount: company._count.jobPostings,
            teamSize: company._count.teamMembers
        };
        return res.status(200).json({ success: true, data: sanitized });
    }
    catch (error) {
        console.error('getPublicCompanyProfile error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch company profile.' });
    }
};
// ─────────────────────────────────────────────────────────────────────
// GET PUBLIC ACTIVE JOBS FOR COMPANY (WITH APPLICATION STATUS)
// ─────────────────────────────────────────────────────────────────────
export const getPublicCompanyJobs = async (req, res) => {
    try {
        const { identifier } = req.params;
        const { department, jobType, locationType, search } = req.query;
        // Check if user is authenticated (from optionalAuth middleware)
        const jobSeekerProfileId = req.user?.jobSeekerProfileId;
        let company = await prisma.company.findUnique({
            where: { id: identifier },
            select: { id: true }
        });
        if (!company) {
            const slugToName = identifier.split('-').join(' ');
            company = await prisma.company.findFirst({
                where: { name: { equals: slugToName, mode: 'insensitive' } },
                select: { id: true }
            });
        }
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found.' });
        }
        const where = {
            companyId: company.id,
            status: 'active',
            ...(department && { department: { equals: department, mode: 'insensitive' } }),
            ...(jobType && { jobType: { equals: jobType, mode: 'insensitive' } }),
            ...(locationType && { locationType: { equals: locationType, mode: 'insensitive' } }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } }
                ]
            })
        };
        const jobs = await prisma.jobPosting.findMany({
            where,
            select: {
                id: true,
                title: true,
                department: true,
                jobType: true,
                locationType: true,
                location: true,
                experienceRequired: true,
                salaryRange: true,
                requiredSkills: true,
                deadline: true,
                openings: true,
                createdAt: true,
                _count: { select: { applications: true } },
                ...(jobSeekerProfileId && {
                    applications: {
                        where: { jobSeekerProfileId },
                        select: { id: true, status: true, appliedAt: true }
                    }
                })
            },
            orderBy: { createdAt: 'desc' }
        });
        const jobsWithStatus = jobs.map(job => ({
            id: job.id,
            title: job.title,
            department: job.department,
            jobType: job.jobType,
            locationType: job.locationType,
            location: job.location,
            experienceRequired: job.experienceRequired,
            salaryRange: job.salaryRange,
            requiredSkills: job.requiredSkills,
            deadline: job.deadline,
            openings: job.openings,
            createdAt: job.createdAt,
            applicationsCount: job._count.applications,
            hasApplied: jobSeekerProfileId ? (job.applications?.length || 0) > 0 : false,
            applicationStatus: jobSeekerProfileId && job.applications?.[0]
                ? job.applications[0].status
                : null,
            appliedAt: jobSeekerProfileId && job.applications?.[0]
                ? job.applications[0].appliedAt
                : null
        }));
        return res.status(200).json({ success: true, data: jobsWithStatus });
    }
    catch (error) {
        console.error('getPublicCompanyJobs error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch jobs.' });
    }
};
// ─────────────────────────────────────────────────────────────────────
// GET SINGLE PUBLIC JOB DETAILS (WITH APPLICATION STATUS)
// ─────────────────────────────────────────────────────────────────────
export const getPublicJobDetails = async (req, res) => {
    try {
        const { jobId } = req.params;
        const jobSeekerProfileId = req.user?.jobSeekerProfileId;
        const job = await prisma.jobPosting.findUnique({
            where: { id: jobId },
            select: {
                id: true,
                title: true,
                department: true,
                description: true,
                jobType: true,
                locationType: true,
                location: true,
                experienceRequired: true,
                requiredSkills: true,
                salaryRange: true,
                deadline: true,
                openings: true,
                status: true,
                createdAt: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                        industry: true,
                        size: true,
                        tagline: true,
                        verificationBadge: true
                    }
                },
                _count: { select: { applications: true } },
                ...(jobSeekerProfileId && {
                    applications: {
                        where: { jobSeekerProfileId },
                        select: {
                            id: true,
                            status: true,
                            appliedAt: true,
                            candidateNotes: true
                        }
                    }
                })
            }
        });
        if (!job || job.status !== 'active') {
            return res.status(404).json({ success: false, message: 'Job not found or no longer active.' });
        }
        const jobWithStatus = {
            ...job,
            applicationsCount: job._count.applications,
            hasApplied: jobSeekerProfileId ? (job.applications?.length || 0) > 0 : false,
            applicationStatus: jobSeekerProfileId && job.applications?.[0]
                ? job.applications[0].status
                : null,
            appliedAt: jobSeekerProfileId && job.applications?.[0]
                ? job.applications[0].appliedAt
                : null
        };
        // Remove applications array from response (already extracted info)
        delete jobWithStatus.applications;
        return res.status(200).json({ success: true, data: jobWithStatus });
    }
    catch (error) {
        console.error('getPublicJobDetails error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch job details.' });
    }
};
// ─────────────────────────────────────────────────────────────────────
// GET CURRENT USER SESSION INFO (FOR PUBLIC PAGES)
// ─────────────────────────────────────────────────────────────────────
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(200).json({
                success: true,
                isAuthenticated: false,
                user: null
            });
        }
        return res.status(200).json({
            success: true,
            isAuthenticated: true,
            user: {
                userId: req.user.userId,
                fullName: req.user.fullName,
                email: req.user.email,
                globalRoles: req.user.globalRoles,
                jobSeekerProfileId: req.user.jobSeekerProfileId
            }
        });
    }
    catch (error) {
        console.error('getCurrentUser error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch user info.' });
    }
};
// ─────────────────────────────────────────────────────────────────────
// GET ALL PUBLIC COMPANIES (Directory)
// ─────────────────────────────────────────────────────────────────────
export const getAllPublicCompanies = async (req, res) => {
    try {
        console.log('reached me');
        const { industry, size, search, verified } = req.query;
        const where = {
            isVerified: true,
            ...(industry && { industry: { equals: industry, mode: 'insensitive' } }),
            ...(size && { size: { equals: size, mode: 'insensitive' } }),
            ...(verified === 'true' && { verificationBadge: { not: 'none' } }),
            ...(search && { name: { contains: search, mode: 'insensitive' } })
        };
        const companies = await prisma.company.findMany({
            where,
            select: {
                id: true,
                name: true,
                logoUrl: true,
                industry: true,
                size: true,
                tagline: true,
                verificationBadge: true,
                _count: {
                    select: { jobPostings: { where: { status: 'active' } } }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        return res.status(200).json({
            success: true,
            data: companies.map(c => ({
                ...c,
                activeJobsCount: c._count.jobPostings
            }))
        });
    }
    catch (error) {
        console.error('getAllPublicCompanies error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch companies.' });
    }
};
// ─────────────────────────────────────────────────────────────────────
// SEARCH ALL ACTIVE JOBS (Global with application status)
// ─────────────────────────────────────────────────────────────────────
export const searchAllJobs = async (req, res) => {
    try {
        const { search, jobType, locationType, location, experienceRequired, page = '1', limit = '20' } = req.query;
        const jobSeekerProfileId = req.user?.jobSeekerProfileId;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {
            status: 'active',
            ...(jobType && { jobType: { equals: jobType, mode: 'insensitive' } }),
            ...(locationType && { locationType: { equals: locationType, mode: 'insensitive' } }),
            ...(location && { location: { contains: location, mode: 'insensitive' } }),
            ...(experienceRequired && { experienceRequired: experienceRequired }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } }
                ]
            })
        };
        const [jobs, total] = await Promise.all([
            prisma.jobPosting.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    department: true,
                    jobType: true,
                    locationType: true,
                    location: true,
                    experienceRequired: true,
                    salaryRange: true,
                    requiredSkills: true,
                    deadline: true,
                    createdAt: true,
                    company: {
                        select: {
                            id: true,
                            name: true,
                            logoUrl: true,
                            industry: true,
                            verificationBadge: true
                        }
                    },
                    _count: { select: { applications: true } },
                    ...(jobSeekerProfileId && {
                        applications: {
                            where: { jobSeekerProfileId },
                            select: { id: true, status: true, appliedAt: true }
                        }
                    })
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.jobPosting.count({ where })
        ]);
        const jobsWithStatus = jobs.map(job => {
            let appliedStatus = false;
            const hasApplied = jobSeekerProfileId ? (job.applications?.length || 0) > 0 : false;
            if (hasApplied && job.applications?.[0]) {
                appliedStatus = job.applications[0].id; // 👈 Set to the application ID string
            }
            return {
                ...job,
                applicationsCount: job._count.applications,
                hasApplied,
                appliedStatus, // 👈 Returns application UUID string, or false if not applied
                applicationStatus: jobSeekerProfileId && job.applications?.[0]
                    ? job.applications[0].status
                    : null,
                applications: undefined // Remove raw relation array from response
            };
        });
        return res.status(200).json({
            success: true,
            data: jobsWithStatus,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        console.error('searchAllJobs error:', error);
        return res.status(500).json({ success: false, message: 'Failed to search jobs.' });
    }
};
//# sourceMappingURL=publicCompany.controller.js.map