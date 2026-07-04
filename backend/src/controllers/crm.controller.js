import { prisma } from '../utils/prisma.ts';
import { CandidateSource, CandidateCrmStatus, ActivityType } from '@prisma/client';
// ─── CANDIDATE CRM PROFILE ───────────────────────────────────────────
/**
 * GET /crm/candidates
 * List all CRM candidate profiles for this company (with filters).
 */
export const getCrmCandidates = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { status, isStarred, priority, source, tags, search, ownerId, limit = '20', page = '1', } = req.query;
        const where = { companyId };
        if (status)
            where.status = status;
        if (isStarred === 'true')
            where.isStarred = true;
        if (priority)
            where.crmPriority = priority;
        if (source)
            where.source = source;
        if (ownerId)
            where.ownerId = ownerId;
        if (tags) {
            where.tags = { hasSome: Array.isArray(tags) ? tags : [tags] };
        }
        if (search) {
            where.jobSeekerProfile = {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            };
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const [profiles, total] = await Promise.all([
            prisma.companyCandidateProfile.findMany({
                where,
                include: {
                    jobSeekerProfile: {
                        select: {
                            fullName: true,
                            email: true,
                            phone: true,
                            profilePhotoUrl: true,
                            location: true,
                            availabilityStatus: true,
                            skills: { select: { name: true } },
                        },
                    },
                    owner: {
                        select: {
                            id: true,
                            user: { select: { id: true } },
                        },
                    },
                },
                orderBy: [{ isStarred: 'desc' }, { updatedAt: 'desc' }],
                skip,
                take,
            }),
            prisma.companyCandidateProfile.count({ where }),
        ]);
        return res.json({
            success: true,
            data: profiles,
            pagination: {
                total,
                page: parseInt(page),
                limit: take,
                totalPages: Math.ceil(total / take),
            },
        });
    }
    catch (error) {
        console.error('getCrmCandidates error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * GET /crm/candidates/:id
 * Get single CRM profile with full interaction history.
 */
export const getCrmCandidateById = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        const { id } = req.params;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const profile = await prisma.companyCandidateProfile.findFirst({
            where: { id, companyId },
            include: {
                jobSeekerProfile: {
                    include: {
                        skills: true,
                        experience: { orderBy: { startYear: 'desc' } },
                        education: true,
                        projects: true,
                        certifications: true,
                        languages: true,
                        achievements: true,
                    },
                },
                owner: {
                    select: { id: true },
                },
                crmInteractions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
            },
        });
        if (!profile)
            return res.status(404).json({ success: false, message: 'CRM profile not found' });
        return res.json({ success: true, data: profile });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * POST /crm/candidates
 * Manually add a candidate to the company CRM.
 * jobSeekerProfileId is required — the candidate must already exist in the system.
 */
export const addCrmCandidate = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        const userId = req.user?.userId;
        if (!companyId || !userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { jobSeekerProfileId, source, sourceUrl, tags, crmNotes, ownerId } = req.body;
        if (!jobSeekerProfileId)
            return res.status(400).json({ success: false, message: 'jobSeekerProfileId is required' });
        const candidate = await prisma.jobSeekerProfile.findUnique({ where: { id: jobSeekerProfileId } });
        if (!candidate)
            return res.status(404).json({ success: false, message: 'Candidate profile not found' });
        const existing = await prisma.companyCandidateProfile.findUnique({
            where: { companyId_jobSeekerProfileId: { companyId, jobSeekerProfileId } },
        });
        if (existing)
            return res.status(409).json({ success: false, message: 'Candidate already in CRM' });
        const crmProfile = await prisma.companyCandidateProfile.create({
            data: {
                companyId,
                jobSeekerProfileId,
                source: source,
                sourceUrl: sourceUrl ?? null,
                tags: tags ?? [],
                crmNotes: crmNotes ?? null,
                ownerId: ownerId ?? null,
                status: CandidateCrmStatus.ACTIVE,
            },
        });
        return res.status(201).json({ success: true, data: crmProfile });
    }
    catch (error) {
        console.error('addCrmCandidate error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * PATCH /crm/candidates/:id
 * Update CRM profile metadata (status, notes, priority, tags, owner, starred).
 */
export const updateCrmCandidate = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        const { id } = req.params;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const existing = await prisma.companyCandidateProfile.findFirst({ where: { id, companyId } });
        if (!existing)
            return res.status(404).json({ success: false, message: 'CRM profile not found' });
        const { status, crmNotes, crmPriority, tags, isStarred, ownerId, source, sourceUrl } = req.body;
        const updated = await prisma.companyCandidateProfile.update({
            where: { id },
            data: {
                ...(status !== undefined && { status: status }),
                ...(crmNotes !== undefined && { crmNotes }),
                ...(crmPriority !== undefined && { crmPriority }),
                ...(tags !== undefined && { tags }),
                ...(isStarred !== undefined && { isStarred }),
                ...(ownerId !== undefined && { ownerId }),
                ...(source !== undefined && { source: source }),
                ...(sourceUrl !== undefined && { sourceUrl }),
            },
        });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * DELETE /crm/candidates/:id
 * Remove candidate from company CRM.
 */
export const removeCrmCandidate = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        const { id } = req.params;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const existing = await prisma.companyCandidateProfile.findFirst({ where: { id, companyId } });
        if (!existing)
            return res.status(404).json({ success: false, message: 'CRM profile not found' });
        await prisma.companyCandidateProfile.delete({ where: { id } });
        return res.json({ success: true, message: 'Candidate removed from CRM' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * POST /crm/candidates/:id/interactions
 * Log a CRM interaction (call, email, note, etc.)
 */
export const logCrmInteraction = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!companyId || !userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { activityType, note, metadata } = req.body;
        if (!activityType)
            return res.status(400).json({ success: false, message: 'activityType is required' });
        const crmProfile = await prisma.companyCandidateProfile.findFirst({ where: { id, companyId } });
        if (!crmProfile)
            return res.status(404).json({ success: false, message: 'CRM profile not found' });
        const [interaction] = await prisma.$transaction([
            prisma.crmInteractionLog.create({
                data: {
                    companyCandidateProfileId: id,
                    activityType: activityType,
                    performedBy: userId,
                    note: note ?? null,
                    metadata: metadata ?? null,
                },
            }),
            prisma.companyCandidateProfile.update({
                where: { id },
                data: { lastContactedAt: new Date() },
            }),
        ]);
        return res.status(201).json({ success: true, data: interaction });
    }
    catch (error) {
        console.error('logCrmInteraction error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
// ─── TALENT POOLS ─────────────────────────────────────────────────────
/**
 * GET /crm/talent-pools
 * List all talent pools for the company.
 */
export const getTalentPools = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const pools = await prisma.talentPool.findMany({
            where: { companyId },
            include: {
                _count: { select: { members: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, data: pools });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * POST /crm/talent-pools
 * Create a new talent pool.
 */
export const createTalentPool = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { name, description } = req.body;
        if (!name)
            return res.status(400).json({ success: false, message: 'Pool name is required' });
        const pool = await prisma.talentPool.create({
            data: { companyId, name: name.trim(), description: description ?? null },
        });
        return res.status(201).json({ success: true, data: pool });
    }
    catch (error) {
        if (error.code === 'P2002')
            return res.status(409).json({ success: false, message: 'A pool with this name already exists' });
        return res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * PATCH /crm/talent-pools/:id
 * Update pool name or description.
 */
export const updateTalentPool = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        const { id } = req.params;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const existing = await prisma.talentPool.findFirst({ where: { id, companyId } });
        if (!existing)
            return res.status(404).json({ success: false, message: 'Talent pool not found' });
        const { name, description } = req.body;
        const updated = await prisma.talentPool.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(description !== undefined && { description }),
            },
        });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * DELETE /crm/talent-pools/:id
 */
export const deleteTalentPool = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        const { id } = req.params;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const existing = await prisma.talentPool.findFirst({ where: { id, companyId } });
        if (!existing)
            return res.status(404).json({ success: false, message: 'Talent pool not found' });
        await prisma.talentPool.delete({ where: { id } });
        return res.json({ success: true, message: 'Talent pool deleted' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * GET /crm/talent-pools/:id/members
 * Get all candidates in a talent pool.
 */
export const getTalentPoolMembers = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        const { id } = req.params;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const pool = await prisma.talentPool.findFirst({ where: { id, companyId } });
        if (!pool)
            return res.status(404).json({ success: false, message: 'Talent pool not found' });
        const members = await prisma.talentPoolMember.findMany({
            where: { talentPoolId: id },
            include: {
                jobSeekerProfile: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        profilePhotoUrl: true,
                        location: true,
                        availabilityStatus: true,
                        skills: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, pool, data: members });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * POST /crm/talent-pools/:id/members
 * Add one or more candidates to a talent pool.
 * Body: { jobSeekerProfileIds: string[] }
 */
export const addTalentPoolMembers = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        const userId = req.user?.userId;
        const { id } = req.params;
        const { jobSeekerProfileIds } = req.body;
        if (!companyId || !userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (!jobSeekerProfileIds?.length)
            return res.status(400).json({ success: false, message: 'jobSeekerProfileIds array is required' });
        const pool = await prisma.talentPool.findFirst({ where: { id, companyId } });
        if (!pool)
            return res.status(404).json({ success: false, message: 'Talent pool not found' });
        // Skip already-added members — upsert approach via createMany with skipDuplicates
        await prisma.talentPoolMember.createMany({
            data: jobSeekerProfileIds.map((profileId) => ({
                talentPoolId: id,
                jobSeekerProfileId: profileId,
                addedBy: userId,
            })),
            skipDuplicates: true,
        });
        return res.json({ success: true, message: `${jobSeekerProfileIds.length} candidate(s) added to pool` });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * DELETE /crm/talent-pools/:id/members/:memberId
 * Remove a candidate from a talent pool.
 */
export const removeTalentPoolMember = async (req, res) => {
    try {
        const companyId = req.company?.companyId;
        const { id, memberId } = req.params;
        if (!companyId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const pool = await prisma.talentPool.findFirst({ where: { id, companyId } });
        if (!pool)
            return res.status(404).json({ success: false, message: 'Talent pool not found' });
        await prisma.talentPoolMember.delete({ where: { id: memberId } });
        return res.json({ success: true, message: 'Member removed from talent pool' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
//# sourceMappingURL=crm.controller.js.map