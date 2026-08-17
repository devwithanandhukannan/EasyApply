import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';

const DEFAULT_FREE_FEATURES = {
  jobPostings: true,
  kanban: true,
  atsScoring: false,
  aiResumeScan: false,
  aiResumeBuilder: false,
  walkinInterview: false,
  seekerDiscovery: false,
  crmTalentPool: false,
  spotJobs: false,
  offerLetters: false,
  interviewScheduling: false
};

const DEFAULT_PRO_FEATURES = {
  jobPostings: true,
  kanban: true,
  atsScoring: true,
  aiResumeScan: true,
  aiResumeBuilder: true,
  walkinInterview: true,
  seekerDiscovery: true,
  crmTalentPool: true,
  spotJobs: true,
  offerLetters: true,
  interviewScheduling: true
};

// ─── PLAN CRUD ────────────────────────────────────────────────────────────────

export const listPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { companySubscriptions: true } } }
    });
    return res.json({ success: true, plans });
  } catch {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const listPublicPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { createdAt: 'asc' }
    });
    return res.json({ success: true, plans });
  } catch {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  try {
    const { name, description, features, maxJobPostings, maxTeamMembers, price, isCustom, isPublic } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Plan name is required' });

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description: description ?? null,
        features: features ?? DEFAULT_FREE_FEATURES,
        maxJobPostings: maxJobPostings ?? 3,
        maxTeamMembers: maxTeamMembers ?? 2,
        price: price ?? null,
        isCustom: isCustom ?? false,
        isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
      }
    });
    return res.status(201).json({ success: true, plan });
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ success: false, message: 'A plan with this name already exists' });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, features, maxJobPostings, maxTeamMembers, price, isActive, isCustom, isPublic } = req.body;
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name,
        description,
        features,
        maxJobPostings,
        maxTeamMembers,
        price,
        isActive,
        isCustom,
        ...(isPublic !== undefined ? { isPublic: Boolean(isPublic) } : {})
      }
    });
    return res.json({ success: true, plan });
  } catch {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deactivatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.subscriptionPlan.update({ where: { id }, data: { isActive: false } });
    return res.json({ success: true, message: 'Plan deactivated' });
  } catch {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── ASSIGN PLAN TO COMPANY ───────────────────────────────────────────────────

export const assignSubscription = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { planId, features, expiresAt, notes } = req.body;

    if (!planId) return res.status(400).json({ success: false, message: 'planId is required' });

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const subscription = await prisma.companySubscription.upsert({
      where: { companyId },
      update: {
        planId,
        features: features ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
        notes: notes ?? null,
        startsAt: new Date(),
      },
      create: {
        companyId,
        planId,
        features: features ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
        notes: notes ?? null,
      },
      include: { plan: true }
    });

    return res.json({ success: true, subscription });
  } catch {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateCompanyFeatureOverride = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { features } = req.body;

    const sub = await prisma.companySubscription.findUnique({ where: { companyId } });
    if (!sub) return res.status(404).json({ success: false, message: 'No subscription found for this company' });

    // Merge new feature overrides with existing ones
    const existing = (sub.features as Record<string, boolean>) ?? {};
    const updated = await prisma.companySubscription.update({
      where: { companyId },
      data: { features: { ...existing, ...features } },
      include: { plan: true }
    });
    return res.json({ success: true, subscription: updated });
  } catch {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export { DEFAULT_FREE_FEATURES, DEFAULT_PRO_FEATURES };
