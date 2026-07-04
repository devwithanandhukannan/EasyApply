import express from 'express';
import { requireCompanyRole } from '../middleware/auth.middleware.ts';
import { ROLES } from '../constants/roles.ts';
import {
    // Templates
    createOfferTemplate,
    getCompanyTemplates,
    updateOfferTemplate,
    deleteOfferTemplate,
    generateTemplateWithAI,

    // Offers
    createOfferLetter,
    updateOfferLetter,
    signOfferLetter,
    sendOfferLetter,
    getCompanyOffers,
    getOfferDetails,
    downloadOfferPDF,
    trackOfferEmail,

    // Candidate
    respondToOffer,
    respondToNegotiation,
} from '../controllers/offer.controller.ts';

const router = express.Router();

// Middleware wrapper that allows job seekers to access candidate routes without company checks
const requireCompanyRoleOrJobSeeker = (roles: number[]) => {
  return (req: any, res: any, next: any) => {
    if (req.user && !req.company) {
      return next();
    }
    return requireCompanyRole(...roles)(req, res, next);
  };
};

// ─── AI GENERATION ─────────────────────────────────────────────────
router.post('/templates/generate-ai', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), generateTemplateWithAI as any);

// ─── TEMPLATE MANAGEMENT ───────────────────────────────────────────
router.post('/templates', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), createOfferTemplate as any);
router.get('/templates', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getCompanyTemplates as any);
router.put('/templates/:id', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateOfferTemplate as any);
router.delete('/templates/:id', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), deleteOfferTemplate as any);

// ─── OFFER LETTER CRUD ─────────────────────────────────────────────
router.post('/create', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), createOfferLetter as any);
router.put('/:id', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateOfferLetter as any);
router.post('/:id/sign', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), signOfferLetter as any);
router.post('/:id/send', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), sendOfferLetter as any);

// ─── OFFER VIEWS ───────────────────────────────────────────────────
router.get('/company/list', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getCompanyOffers as any);
router.get('/:id', requireCompanyRoleOrJobSeeker([ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER]), getOfferDetails as any);
router.get('/:id/download', requireCompanyRoleOrJobSeeker([ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER]), downloadOfferPDF as any);

// ─── TRACKING & RESPONSE ───────────────────────────────────────────
router.get('/:id/track', trackOfferEmail as any);
router.post('/:id/respond', requireCompanyRoleOrJobSeeker([ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR]), respondToOffer as any);
router.post('/:id/respond-negotiation', requireCompanyRoleOrJobSeeker([ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR]), respondToNegotiation as any);

export default router;