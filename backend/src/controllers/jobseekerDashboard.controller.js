import { prisma } from '../utils/prisma.ts';
const getProfileId = async (userId) => {
    const p = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
    return p?.id ?? null;
};
export const getJobSeekerDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;
        const profileId = await getProfileId(userId);
        if (!profileId) {
            return res.status(404).json({ success: false, message: 'Profile not found. Complete your profile to get started.' });
        }
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [profile, applicationStats, recentApplications, upcomingInterviews, pendingOffers, primaryResume, applicationTimeline, rejectedThisMonth, totalResumes,] = await Promise.all([
            prisma.jobSeekerProfile.findUnique({
                where: { id: profileId },
                include: { skills: true }
            }),
            prisma.application.groupBy({
                by: ['status'],
                where: { jobSeekerProfileId: profileId },
                _count: { status: true }
            }),
            prisma.application.findMany({
                where: { jobSeekerProfileId: profileId },
                orderBy: { appliedAt: 'desc' },
                take: 5,
                include: {
                    jobPosting: {
                        include: { company: { select: { name: true, logoUrl: true } } }
                    }
                }
            }),
            prisma.interview.findMany({
                where: {
                    application: { jobSeekerProfileId: profileId },
                    scheduledTime: { gte: now, lte: sevenDaysFromNow },
                    status: { in: ['scheduled', 'confirmed'] }
                },
                orderBy: { scheduledTime: 'asc' },
                take: 5,
                include: {
                    application: {
                        include: {
                            jobPosting: {
                                include: { company: { select: { name: true, logoUrl: true } } }
                            }
                        }
                    }
                }
            }),
            prisma.offerLetter.findMany({
                where: {
                    application: { jobSeekerProfileId: profileId },
                    status: { in: ['sent', 'viewed', 'pending'] }
                },
                include: {
                    application: {
                        include: {
                            jobPosting: {
                                include: { company: { select: { name: true, logoUrl: true } } }
                            }
                        }
                    }
                },
                orderBy: { sentAt: 'desc' }
            }),
            prisma.resume.findFirst({
                where: { jobSeekerProfileId: profileId, isPrimary: true },
                select: { id: true, name: true, atsScore: true, updatedAt: true }
            }),
            prisma.application.findMany({
                where: { jobSeekerProfileId: profileId },
                orderBy: { appliedAt: 'desc' },
                take: 30,
                select: { status: true, appliedAt: true }
            }),
            prisma.application.count({
                where: {
                    jobSeekerProfileId: profileId,
                    status: 'rejected',
                    appliedAt: { gte: startOfMonth }
                }
            }),
            prisma.resume.count({ where: { jobSeekerProfileId: profileId } }),
        ]);
        const completionFactors = [
            !!profile?.fullName, !!profile?.email, !!profile?.phone,
            !!profile?.location, !!profile?.bio, (profile?.skills?.length ?? 0) >= 3,
            !!primaryResume
        ];
        const completionScore = Math.round((completionFactors.filter(Boolean).length / completionFactors.length) * 100);
        const statusMap = applicationStats.reduce((acc, s) => {
            acc[s.status] = s._count.status;
            return acc;
        }, {});
        const totalApplications = Object.values(statusMap).reduce((a, b) => a + b, 0);
        const activeApplications = totalApplications
            - (statusMap.rejected ?? 0)
            - (statusMap.hired ?? 0);
        const weeklyActivity = Array(4).fill(0).map((_, i) => {
            const weekStart = new Date(now.getTime() - (i + 1) * 7 * 86400000);
            const weekEnd = new Date(now.getTime() - i * 7 * 86400000);
            const count = applicationTimeline.filter(a => a.appliedAt >= weekStart && a.appliedAt < weekEnd).length;
            return { weekOffset: -(i + 1), count };
        }).reverse();
        return res.json({
            success: true,
            data: {
                profile: {
                    id: profile?.id,
                    fullName: profile?.fullName,
                    email: profile?.email,
                    location: profile?.location,
                    profilePhotoUrl: profile?.profilePhotoUrl,
                    availabilityStatus: profile?.availabilityStatus,
                    skills: profile?.skills?.map(s => s.name) ?? [],
                    completionScore,
                    completionTips: buildCompletionTips(profile, primaryResume),
                },
                applicationSummary: {
                    total: totalApplications,
                    active: activeApplications,
                    hired: statusMap.hired ?? 0,
                    rejected: statusMap.rejected ?? 0,
                    inInterview: (statusMap.technical_round ?? 0) + (statusMap.hr_round ?? 0),
                    offerStage: statusMap.offer_sent ?? 0,
                    rejectedThisMonth,
                    byStatus: statusMap,
                },
                recentApplications: recentApplications.map(app => ({
                    applicationId: app.id,
                    status: app.status,
                    appliedAt: app.appliedAt,
                    isWithdrawn: app.isWithdrawn,
                    job: {
                        jobId: app.jobPosting.id,
                        title: app.jobPosting.title,
                        jobType: app.jobPosting.jobType,
                        location: app.jobPosting.location,
                    },
                    company: {
                        name: app.jobPosting.company.name,
                        logoUrl: app.jobPosting.company.logoUrl,
                    }
                })),
                upcomingInterviews: upcomingInterviews.map(i => ({
                    interviewId: i.id,
                    scheduledTime: i.scheduledTime,
                    durationMinutes: i.durationMinutes,
                    format: i.format,
                    status: i.status,
                    joinLink: i.joinLink,
                    livekitRoomName: i.livekitRoomName,
                    job: i.application.jobPosting.title,
                    company: {
                        name: i.application.jobPosting.company.name,
                        logoUrl: i.application.jobPosting.company.logoUrl,
                    }
                })),
                pendingOffers: pendingOffers.map(o => ({
                    offerId: o.id,
                    position: o.position,
                    salary: o.salary,
                    currency: o.currency,
                    startDate: o.startDate,
                    status: o.status,
                    sentAt: o.sentAt,
                    company: {
                        name: o.application.jobPosting.company.name,
                        logoUrl: o.application.jobPosting.company.logoUrl,
                    }
                })),
                resume: primaryResume
                    ? {
                        id: primaryResume.id,
                        name: primaryResume.name,
                        atsScore: primaryResume.atsScore,
                        lastUpdated: primaryResume.updatedAt,
                        totalResumes,
                    }
                    : null,
                activityChart: weeklyActivity,
            }
        });
    }
    catch (error) {
        console.error('Job seeker dashboard error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
function buildCompletionTips(profile, resume) {
    const tips = [];
    if (!profile?.phone)
        tips.push('Add your phone number');
    if (!profile?.bio)
        tips.push('Write a short bio');
    if (!profile?.location)
        tips.push('Add your location');
    if ((profile?.skills?.length ?? 0) < 3)
        tips.push('Add at least 3 skills');
    if (!resume)
        tips.push('Upload or build a resume');
    if (!profile?.linkedin)
        tips.push('Link your LinkedIn profile');
    return tips;
}
export const getApplicationInsights = async (req, res) => {
    try {
        const userId = req.user.userId;
        const profileId = await getProfileId(userId);
        if (!profileId)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const applications = await prisma.application.findMany({
            where: { jobSeekerProfileId: profileId },
            include: {
                jobPosting: {
                    include: { company: { select: { name: true, industry: true } } }
                },
                resume: { select: { atsScore: true } },
                interviews: { select: { status: true } },
                statusHistory: { orderBy: { createdAt: 'asc' } }
            },
            orderBy: { appliedAt: 'asc' }
        });
        const industryMap = {};
        applications.forEach(a => {
            const ind = a.jobPosting.company.industry ?? 'Other';
            industryMap[ind] = (industryMap[ind] ?? 0) + 1;
        });
        const scores = applications
            .map(a => a.resume?.atsScore)
            .filter((s) => s !== null && s !== undefined);
        const avgAts = scores.length
            ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
            : null;
        const responded = applications.filter(a => a.statusHistory.length > 1).length;
        const responseRate = applications.length
            ? ((responded / applications.length) * 100).toFixed(1)
            : '0';
        const responseTimes = applications
            .filter(a => a.statusHistory.length > 1)
            .map(a => {
            const applied = a.statusHistory[0]?.createdAt;
            const firstResponse = a.statusHistory[1]?.createdAt;
            if (!applied || !firstResponse)
                return null;
            return (firstResponse.getTime() - applied.getTime()) / 86400000;
        })
            .filter((t) => t !== null);
        const avgResponseDays = responseTimes.length
            ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
            : null;
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
            const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 0);
            const count = applications.filter(a => a.appliedAt >= start && a.appliedAt <= end).length;
            monthlyTrend.push({
                month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
                count
            });
        }
        return res.json({
            success: true,
            data: {
                totalApplications: applications.length,
                responseRate: parseFloat(responseRate),
                avgAtsScore: avgAts ? parseFloat(avgAts) : null,
                avgResponseTimeDays: avgResponseDays ? parseFloat(avgResponseDays) : null,
                industryBreakdown: Object.entries(industryMap).map(([k, v]) => ({ industry: k, count: v })),
                monthlyTrend,
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
//# sourceMappingURL=jobseekerDashboard.controller.js.map