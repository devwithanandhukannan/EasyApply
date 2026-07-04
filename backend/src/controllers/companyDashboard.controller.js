import { prisma } from '../utils/prisma.ts';
import { ApplicationStatus } from '@prisma/client';
import { rankCandidates, rankCandidatesAgainstQuery } from '../services/groq.service.ts';
export const getCompanyDashboard = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized: Company context missing.' });
        const jobs = await prisma.jobPosting.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { applications: true } },
                applications: { select: { status: true } },
            },
        });
        const formattedJobs = jobs.map((job) => {
            const statusCounts = job.applications.reduce((acc, app) => {
                acc[app.status] = (acc[app.status] || 0) + 1;
                return acc;
            }, {});
            return {
                id: job.id,
                title: job.title,
                department: job.department,
                jobType: job.jobType,
                locationType: job.locationType,
                location: job.location,
                status: job.status === 'paused' ? 'draft' : job.status,
                deadline: job.deadline,
                openings: job.openings,
                createdAt: job.createdAt,
                totalApplications: job._count.applications,
                applicationBreakdown: statusCounts,
            };
        });
        const totalJobs = jobs.length;
        const totalApplications = jobs.reduce((sum, j) => sum + j._count.applications, 0);
        const activeJobs = jobs.filter((j) => j.status === 'active').length;
        return res.status(200).json({
            success: true,
            summary: { totalJobs, activeJobs, totalApplications },
            jobs: formattedJobs,
        });
    }
    catch (error) {
        console.error('Dashboard fetch error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load dashboard data.' });
    }
};
export const getJobApplications = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        const { jobId } = req.params;
        const { status } = req.query;
        const job = await prisma.jobPosting.findFirst({ where: { id: jobId, companyId } });
        if (!job)
            return res.status(404).json({ success: false, message: 'Job posting not found.' });
        const whereClause = { jobPostingId: jobId };
        if (status && typeof status === 'string')
            whereClause.status = status;
        const applications = await prisma.application.findMany({
            where: whereClause,
            orderBy: { appliedAt: 'desc' },
            include: {
                jobSeekerProfile: {
                    select: {
                        id: true, fullName: true, email: true, phone: true, location: true,
                        linkedin: true, github: true, portfolio: true, availabilityStatus: true,
                        skills: { select: { name: true } },
                    },
                },
                resume: { select: { id: true, name: true, source: true, atsScore: true, aiSuggestions: true } },
            },
        });
        const formatted = applications.map((app) => ({
            applicationId: app.id,
            status: app.status,
            appliedAt: app.appliedAt,
            candidate: {
                profileId: app.jobSeekerProfile.id,
                fullName: app.jobSeekerProfile.fullName,
                email: app.jobSeekerProfile.email,
                phone: app.jobSeekerProfile.phone,
                location: app.jobSeekerProfile.location,
                linkedin: app.jobSeekerProfile.linkedin,
                github: app.jobSeekerProfile.github,
                portfolio: app.jobSeekerProfile.portfolio,
                availabilityStatus: app.jobSeekerProfile.availabilityStatus,
                skills: app.jobSeekerProfile.skills.map((s) => s.name),
            },
            resume: app.resume,
        }));
        return res.status(200).json({
            success: true,
            job: { id: job.id, title: job.title, status: job.status === 'paused' ? 'draft' : job.status, openings: job.openings },
            totalApplications: applications.length,
            applications: formatted,
        });
    }
    catch (error) {
        console.error('Job applications fetch error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve applications.' });
    }
};
export const aiFilterCandidates = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        if (!companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }
        const { jobId } = req.params;
        // Extract custom constraints from request body
        const { customPrompt } = req.body;
        const topN = Math.max(1, parseInt(req.body.topN ?? '5', 10));
        const job = await prisma.jobPosting.findFirst({
            where: { id: jobId, companyId }
        });
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job posting not found.' });
        }
        const applications = await prisma.application.findMany({
            where: { jobPostingId: jobId },
            include: {
                jobSeekerProfile: {
                    include: {
                        skills: { select: { name: true } },
                        experience: true,
                        education: true,
                        projects: true,
                        certifications: true,
                    },
                },
                resume: { select: { id: true, name: true, atsScore: true, content: true, aiSuggestions: true } },
            },
        });
        if (applications.length === 0) {
            return res.status(200).json({ success: true, message: 'No applications found.', rankedCandidates: [] });
        }
        const candidateSnapshots = applications.map((app) => ({
            applicationId: app.id,
            candidateName: app.jobSeekerProfile.fullName,
            skills: app.jobSeekerProfile.skills.map((s) => s.name),
            experience: app.jobSeekerProfile.experience.map((e) => ({
                company: e.company,
                role: e.role,
                startYear: e.startYear,
                endYear: e.endYear,
                current: e.current,
                description: e.description,
            })),
            education: app.jobSeekerProfile.education.map((ed) => ({
                institution: ed.institution,
                degree: ed.degree,
                field: ed.field,
                endYear: ed.endYear,
                cgpa: ed.cgpa,
            })),
            projects: app.jobSeekerProfile.projects.map((p) => ({
                name: p.name,
                technologies: p.technologies,
                description: p.description,
            })),
            certifications: app.jobSeekerProfile.certifications.map((c) => c.name),
            atsScore: app.resume?.atsScore ?? null,
            resumeContent: app.resume?.content ?? null,
        }));
        // Passing customPrompt along to the AI evaluator tool
        const aiResult = await rankCandidates(job.description, job.requiredSkills, candidateSnapshots, topN, customPrompt);
        const enrichedRankings = (aiResult.rankings ?? []).map((ranked) => {
            const original = applications.find((a) => a.id === ranked.applicationId);
            if (!original)
                return ranked;
            return {
                rank: ranked.rank,
                score: ranked.score,
                applicationId: ranked.applicationId,
                matchReason: ranked.matchReason,
                strengths: ranked.strengths,
                gaps: ranked.gaps,
                recommendation: ranked.recommendation,
                candidate: {
                    profileId: original.jobSeekerProfile.id,
                    fullName: original.jobSeekerProfile.fullName,
                    email: original.jobSeekerProfile.email,
                    phone: original.jobSeekerProfile.phone,
                    location: original.jobSeekerProfile.location,
                    linkedin: original.jobSeekerProfile.linkedin,
                    github: original.jobSeekerProfile.github,
                    availabilityStatus: original.jobSeekerProfile.availabilityStatus,
                    skills: original.jobSeekerProfile.skills.map((s) => s.name),
                },
                resume: {
                    id: original.resume?.id,
                    name: original.resume?.name,
                    atsScore: original.resume?.atsScore
                },
                appliedAt: original.appliedAt,
                currentStatus: original.status,
            };
        });
        return res.status(200).json({
            success: true,
            job: { id: job.id, title: job.title },
            totalApplicants: applications.length,
            requestedTopN: topN,
            aiSummary: aiResult.summary ?? '',
            rankedCandidates: enrichedRankings,
        });
    }
    catch (error) {
        console.error('AI filter error:', error);
        return res.status(500).json({ success: false, message: 'AI candidate filtering failed.' });
    }
};
export const getCandidateDetail = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        const { applicationId } = req.params;
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                jobPosting: { select: { id: true, title: true, companyId: true } },
                jobSeekerProfile: {
                    include: {
                        skills: true,
                        experience: { orderBy: { startYear: 'desc' } },
                        education: { orderBy: { startYear: 'desc' } },
                        projects: true,
                        certifications: true,
                        languages: true,
                        achievements: true,
                        resumes: {
                            select: {
                                id: true, name: true, source: true, atsScore: true,
                                isPrimary: true, content: true, aiSuggestions: true, createdAt: true,
                            },
                        },
                    },
                },
                resume: true,
                interviews: {
                    orderBy: { scheduledTime: 'desc' },
                    include: {
                        feedbacks: {
                            include: {
                                // FIX: InterviewFeedback.interviewer → TeamMember (not User)
                                interviewer: {
                                    select: {
                                        id: true,
                                        user: { select: { id: true } },
                                    },
                                },
                            },
                        },
                    },
                },
                offerLetters: true,
            },
        });
        if (!application)
            return res.status(404).json({ success: false, message: 'Application record not found.' });
        if (application.jobPosting.companyId !== companyId)
            return res.status(403).json({ success: false, message: 'Access denied.' });
        return res.status(200).json({
            success: true,
            application: { id: application.id, status: application.status, appliedAt: application.appliedAt, updatedAt: application.updatedAt },
            job: { id: application.jobPosting.id, title: application.jobPosting.title },
            candidate: application.jobSeekerProfile,
            appliedResume: application.resume,
            interviews: application.interviews,
            offerLetters: application.offerLetters,
        });
    }
    catch (error) {
        console.error('Candidate detail fetch error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load candidate details.' });
    }
};
/**
 * BUG FIX: Was using invalid statuses like 'reviewed', 'shortlisted', 'interview', 'offer'
 * which don't exist in the ApplicationStatus enum. Now uses enum values only.
 */
export const updateApplicationStatus = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        const { applicationId } = req.params;
        const { status, notes } = req.body;
        const validStatuses = Object.values(ApplicationStatus);
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
        }
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { jobPosting: { select: { companyId: true } } },
        });
        if (!application || application.jobPosting.companyId !== companyId)
            return res.status(404).json({ success: false, message: 'Application not found or access denied.' });
        const userId = req.user?.userId ?? 'system';
        const updated = await prisma.$transaction(async (tx) => {
            const app = await tx.application.update({
                where: { id: applicationId },
                data: { status: status, lastActivityAt: new Date() },
                select: { id: true, status: true, updatedAt: true },
            });
            await tx.applicationHistory.create({
                data: {
                    applicationId,
                    fromStatus: application.status,
                    toStatus: status,
                    changedBy: userId,
                    changedByType: 'user',
                    notes: notes || `Status updated to ${status}`,
                },
            });
            return app;
        });
        return res.status(200).json({
            success: true,
            message: `Application status updated to "${status}".`,
            application: updated,
        });
    }
    catch (error) {
        console.error('Status update error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update application status.' });
    }
};
export const searchCandidates = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        const { jobDescription, requiredSkills = [], filters = {} } = req.body;
        const { minMatch = 0, location, skills, availability, minAtsScore = 0 } = filters;
        const applications = await prisma.application.findMany({
            where: { jobPosting: { companyId } },
            include: {
                jobSeekerProfile: {
                    include: {
                        skills: true,
                        experience: true,
                        education: true,
                        projects: true,
                        certifications: true,
                        resumes: { where: { isPrimary: true }, take: 1 },
                    },
                },
            },
        });
        const candidateMap = new Map();
        for (const app of applications) {
            const profile = app.jobSeekerProfile;
            if (!candidateMap.has(profile.id)) {
                candidateMap.set(profile.id, {
                    applicationId: app.id,
                    profileId: profile.id,
                    fullName: profile.fullName,
                    email: profile.email,
                    phone: profile.phone,
                    location: profile.location,
                    availabilityStatus: profile.availabilityStatus,
                    skills: profile.skills.map((s) => s.name),
                    experience: profile.experience,
                    education: profile.education,
                    projects: profile.projects,
                    certifications: profile.certifications,
                    atsScore: profile.resumes[0]?.atsScore ?? null,
                });
            }
        }
        let candidatesList = Array.from(candidateMap.values()).filter((c) => {
            if (minAtsScore > 0 && (c.atsScore ?? 0) < minAtsScore)
                return false;
            if (location && c.location?.toLowerCase() !== location.toLowerCase())
                return false;
            if (availability && c.availabilityStatus !== availability)
                return false;
            if (skills?.length) {
                const hasSkill = skills.some((s) => c.skills.some((cs) => cs.toLowerCase().includes(s.toLowerCase())));
                if (!hasSkill)
                    return false;
            }
            return true;
        });
        let rankings = [];
        let aiSummary = '';
        if (jobDescription?.trim().length > 0) {
            const candidatesForAI = candidatesList.map((c) => ({
                id: c.profileId,
                fullName: c.fullName,
                skills: c.skills,
                experience: c.experience.map((e) => ({ company: e.company, role: e.role, startYear: e.startYear, endYear: e.endYear })),
                education: c.education,
                projects: c.projects,
                certifications: c.certifications.map((cert) => cert.name),
                atsScore: c.atsScore,
            }));
            const aiResult = await rankCandidatesAgainstQuery(jobDescription, requiredSkills, candidatesForAI, Math.min(50, candidatesList.length));
            rankings = aiResult.rankings;
            aiSummary = aiResult.summary;
            candidatesList = candidatesList
                .filter((c) => {
                const rank = rankings.find((r) => r.candidateId === c.profileId);
                return rank && rank.score >= minMatch;
            })
                .sort((a, b) => {
                const aScore = rankings.find((r) => r.candidateId === a.profileId)?.score || 0;
                const bScore = rankings.find((r) => r.candidateId === b.profileId)?.score || 0;
                return bScore - aScore;
            });
        }
        const result = candidatesList.map((c) => {
            const rank = rankings.find((r) => r.candidateId === c.profileId);
            return {
                applicationId: c.applicationId,
                profileId: c.profileId,
                fullName: c.fullName,
                email: c.email,
                phone: c.phone,
                location: c.location,
                skills: c.skills,
                availabilityStatus: c.availabilityStatus,
                atsScore: c.atsScore,
                matchScore: rank?.score || null,
                matchReason: rank?.matchReason || '',
                strengths: rank?.strengths || [],
                gaps: rank?.gaps || [],
                recommendation: rank?.recommendation || '',
            };
        });
        return res.json({ success: true, aiSummary, total: result.length, candidates: result });
    }
    catch (error) {
        console.error('Candidate search error:', error);
        return res.status(500).json({ success: false, message: 'Search failed.' });
    }
};
//# sourceMappingURL=companyDashboard.controller.js.map