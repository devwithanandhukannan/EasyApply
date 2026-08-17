import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';

// ─── COMPANY: SUBMIT CUSTOM FEATURE REQUEST ────────────────────────────────────

export const createCompanyFeatureRequest = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'Company authentication required' });
    }

    const { requestedFeatures, message, budgetRange } = req.body;
    if (!requestedFeatures || typeof requestedFeatures !== 'object') {
      return res.status(400).json({ success: false, message: 'requestedFeatures is required' });
    }

    const request = await prisma.companyFeatureRequest.create({
      data: {
        companyId,
        requestedFeatures,
        message: message ? String(message).trim() : null,
        budgetRange: budgetRange ? String(budgetRange).trim() : null,
        status: 'PENDING',
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            industry: true,
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Your custom business feature request has been submitted to EasyApply administrators.',
      request,
    });
  } catch (err) {
    console.error('[FeatureRequest] createCompanyFeatureRequest error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── COMPANY: GET OWN REQUESTS ────────────────────────────────────────────────

export const getMyCompanyFeatureRequests = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'Company authentication required' });
    }

    const requests = await prisma.companyFeatureRequest.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, requests });
  } catch (err) {
    console.error('[FeatureRequest] getMyCompanyFeatureRequests error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── ADMIN: LIST ALL FEATURE REQUESTS ──────────────────────────────────────────

export const listAllFeatureRequests = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status.toUpperCase();
    }

    const requests = await prisma.companyFeatureRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            industry: true,
            size: true,
            subscription: {
              include: {
                plan: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    });

    return res.json({ success: true, requests });
  } catch (err) {
    console.error('[FeatureRequest] listAllFeatureRequests error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── ADMIN: UPDATE FEATURE REQUEST STATUS ──────────────────────────────────────

export const updateFeatureRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    const updated = await prisma.companyFeatureRequest.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        ...(adminNotes !== undefined ? { adminNotes: adminNotes ? String(adminNotes).trim() : null } : {}),
      },
      include: {
        company: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res.json({ success: true, request: updated });
  } catch (err) {
    console.error('[FeatureRequest] updateFeatureRequestStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
