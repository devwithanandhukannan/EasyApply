// src/controllers/companyDashboard.controller.ts
import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';
import { rankCandidates, rankCandidatesAgainstQuery } from '../services/groq.service.ts';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/company/dashboard
// Returns every job posting for the company with aggregate application counts
// ─────────────────────────────────────────────────────────────────────────────
export const getCompanyDashboard = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Company context missing.' });
    }

    const jobs = await prisma.jobPosting.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { applications: true },
        },
        applications: {
          select: {
            status: true,
          },
        },
      },
    });

    const formattedJobs = jobs.map((job) => {
      // Tally application statuses for a quick pipeline view
      const statusCounts = job.applications.reduce(
        (acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

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

    // Company-level aggregate summary
    const totalJobs = jobs.length;
    const totalApplications = jobs.reduce((sum, j) => sum + j._count.applications, 0);
    const activeJobs = jobs.filter((j) => j.status === 'active').length;

    return res.status(200).json({
      success: true,
      summary: { totalJobs, activeJobs, totalApplications },
      jobs: formattedJobs,
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard data.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/company/jobs/:jobId/applications
// Returns all applicants for a specific job with profile + resume summary
// Query params: ?status=applied|shortlisted|... (optional filter)
// ─────────────────────────────────────────────────────────────────────────────
export const getJobApplications = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { jobId } = req.params;
    const { status } = req.query;

    // Ownership check — ensure this job belongs to the requesting company
    const job = await prisma.jobPosting.findFirst({
      where: { id: jobId, companyId },
    });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found.' });
    }

    const whereClause: any = { jobPostingId: jobId };
    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      orderBy: { appliedAt: 'desc' },
      include: {
        jobSeekerProfile: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            location: true,
            linkedin: true,
            github: true,
            portfolio: true,
            availabilityStatus: true,
            skills: { select: { name: true } },
          },
        },
        resume: {
          select: {
            id: true,
            name: true,
            source: true,
            atsScore: true,
            aiSuggestions: true,
            // content omitted here for list view — use the detail endpoint for full content
          },
        },
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
      job: {
        id: job.id,
        title: job.title,
        status: job.status === 'paused' ? 'draft' : job.status,
        openings: job.openings,
      },
      totalApplications: applications.length,
      applications: formatted,
    });
  } catch (error) {
    console.error('Job applications fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve applications.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/company/jobs/:jobId/ai-filter
// Uses Groq to rank applicants against the job description
// Body: { topN: number }  — how many top candidates to surface
// ─────────────────────────────────────────────────────────────────────────────
export const aiFilterCandidates = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { jobId } = req.params;
    const topN = Math.max(1, parseInt(req.body.topN ?? '5', 10));

    // Verify job ownership
    const job = await prisma.jobPosting.findFirst({
      where: { id: jobId, companyId },
    });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found.' });
    }

    // Pull every application with full profile + resume content
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
        resume: {
          select: {
            id: true,
            name: true,
            atsScore: true,
            content: true,
            aiSuggestions: true,
          },
        },
      },
    });

    if (applications.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No applications found for this job posting.',
        rankedCandidates: [],
      });
    }

    // Build a compact candidate snapshot to send to the AI
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

    // Call Groq AI ranking
    const aiResult = await rankCandidates(job.description, job.requiredSkills, candidateSnapshots, topN);

    // Merge AI rankings back with full application data for the response
    const enrichedRankings = (aiResult.rankings ?? []).map((ranked: any) => {
      const original = applications.find((a) => a.id === ranked.applicationId);
      if (!original) return ranked;

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
          atsScore: original.resume?.atsScore,
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
  } catch (error) {
    console.error('AI filter error:', error);
    return res.status(500).json({ success: false, message: 'AI candidate filtering failed.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/company/applications/:applicationId
// Returns complete candidate profile, all resume content, and application history
// ─────────────────────────────────────────────────────────────────────────────
export const getCandidateDetail = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { applicationId } = req.params;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        jobPosting: {
          select: { id: true, title: true, companyId: true },
        },
        jobSeekerProfile: {
          include: {
            skills: true,
            experience: { orderBy: { startYear: 'desc' } },
            education: { orderBy: { startYear: 'desc' } },
            projects: true,
            certifications: true,
            languages: true,
            achievements: true,
            // Return all resumes so recruiter can browse history
            resumes: {
              select: {
                id: true,
                name: true,
                source: true,
                atsScore: true,
                isPrimary: true,
                content: true,
                aiSuggestions: true,
                createdAt: true,
              },
            },
          },
        },
        resume: true, // The specific resume used for THIS application
        interviews: {
          orderBy: { scheduledTime: 'desc' },
          include: {
            feedbacks: {
              include: {
                interviewer: {
                  select: { id: true, mobileNumber: true },
                },
              },
            },
          },
        },
        offerLetters: true,
      },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application record not found.' });
    }

    // Ownership guard — make sure this application belongs to the requesting company's job
    if (application.jobPosting.companyId !== companyId) {
      return res.status(403).json({ success: false, message: 'Access denied: This application is not linked to your company.' });
    }

    return res.status(200).json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt,
        updatedAt: application.updatedAt,
      },
      job: {
        id: application.jobPosting.id,
        title: application.jobPosting.title,
      },
      candidate: application.jobSeekerProfile,
      appliedResume: application.resume,   // Resume submitted with this specific application
      interviews: application.interviews,
      offerLetters: application.offerLetters,
    });
  } catch (error) {
    console.error('Candidate detail fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load candidate details.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/company/applications/:applicationId/status
// Update application status (shortlisted, rejected, interview, etc.)
// Body: { status: ApplicationStatus }
// ─────────────────────────────────────────────────────────────────────────────
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { applicationId } = req.params;
    const { status } = req.body;

    const validStatuses = ['applied', 'reviewed', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Ownership check via join
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { jobPosting: { select: { companyId: true } } },
    });

    if (!application || application.jobPosting.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Application not found or access denied.' });
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
      select: { id: true, status: true, updatedAt: true },
    });

    return res.status(200).json({
      success: true,
      message: `Application status updated to "${status}".`,
      application: updated,
    });
  } catch (error) {
    console.error('Status update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update application status.' });
  }
};

// POST /api/company/candidates/search
export const searchCandidates = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const {
      jobDescription,
      requiredSkills = [],
      filters = {},
    } = req.body;

    const { minMatch = 0, location, skills, availability, minAtsScore = 0 } = filters;

    // Step 1 – Get all candidates who have applied to ANY job of this company
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

    // Deduplicate candidates (one candidate may have applied to multiple jobs)
    const candidateMap = new Map();
    for (const app of applications) {
      const profile = app.jobSeekerProfile;
      if (!candidateMap.has(profile.id)) {
        candidateMap.set(profile.id, {
          applicationId: app.id,    // use the most recent or first application id
          profileId: profile.id,
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          availabilityStatus: profile.availabilityStatus,
          skills: profile.skills.map(s => s.name),
          experience: profile.experience,
          education: profile.education,
          projects: profile.projects,
          certifications: profile.certifications,
          atsScore: profile.resumes[0]?.atsScore ?? null,
        });
      }
    }
    let candidatesList = Array.from(candidateMap.values());

    // Step 2 – Apply local filters (location, skills, ATS, availability)
    candidatesList = candidatesList.filter(c => {
      if (minAtsScore > 0 && (c.atsScore ?? 0) < minAtsScore) return false;
      if (location && c.location?.toLowerCase() !== location.toLowerCase()) return false;
      if (availability && c.availabilityStatus !== availability) return false;
      if (skills?.length) {
        const hasSkill = skills.some((s: string) => c.skills.some(cs => cs.toLowerCase().includes(s.toLowerCase())));
        if (!hasSkill) return false;
      }
      return true;
    });

    // Step 3 – AI ranking if job description provided
    let rankings: any[] = [];
    let aiSummary = '';
    if (jobDescription && jobDescription.trim().length > 0) {
      const candidatesForAI = candidatesList.map(c => ({
        id: c.profileId,
        fullName: c.fullName,
        skills: c.skills,
        experience: c.experience.map(e => ({ company: e.company, role: e.role, startYear: e.startYear, endYear: e.endYear })),
        education: c.education,
        projects: c.projects,
        certifications: c.certifications.map(cert => cert.name),
        atsScore: c.atsScore,
      }));
      const aiResult = await rankCandidatesAgainstQuery(
        jobDescription,
        requiredSkills,
        candidatesForAI,
        Math.min(50, candidatesList.length)
      );
      rankings = aiResult.rankings;
      aiSummary = aiResult.summary;
      // Filter by minMatch score
      candidatesList = candidatesList.filter(c => {
        const rank = rankings.find(r => r.candidateId === c.profileId);
        return rank && rank.score >= minMatch;
      });
      // Sort by AI score descending
      candidatesList.sort((a, b) => {
        const aScore = rankings.find(r => r.candidateId === a.profileId)?.score || 0;
        const bScore = rankings.find(r => r.candidateId === b.profileId)?.score || 0;
        return bScore - aScore;
      });
    }

    // Step 4 – Build response
    const result = candidatesList.map(c => {
      const rank = rankings.find(r => r.candidateId === c.profileId);
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
  } catch (error) {
    console.error('Candidate search error:', error);
    return res.status(500).json({ success: false, message: 'Search failed.' });
  }
};