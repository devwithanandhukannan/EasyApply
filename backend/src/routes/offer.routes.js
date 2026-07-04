import express from 'express';
import { requireCompanyRole } from '../middleware/auth.middleware.ts';
import { ROLES } from '../constants/roles.ts';
import { 
// Templates
createOfferTemplate, getCompanyTemplates, updateOfferTemplate, deleteOfferTemplate, generateTemplateWithAI, 
// Offers
createOfferLetter, updateOfferLetter, signOfferLetter, sendOfferLetter, getCompanyOffers, getOfferDetails, downloadOfferPDF, trackOfferEmail, 
// Candidate
respondToOffer, respondToNegotiation, } from '../controllers/offer.controller.ts';
const router = express.Router();
// Middleware wrapper that allows job seekers to access candidate routes without company checks
const requireCompanyRoleOrJobSeeker = (roles) => {
    return (req, res, next) => {
        if (req.user && !req.company) {
            return next();
        }
        return requireCompanyRole(...roles)(req, res, next);
    };
};
// ─── AI GENERATION ─────────────────────────────────────────────────
router.post('/templates/generate-ai', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), generateTemplateWithAI);
// ─── TEMPLATE MANAGEMENT ───────────────────────────────────────────
router.post('/templates', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), createOfferTemplate);
router.get('/templates', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getCompanyTemplates);
router.put('/templates/:id', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateOfferTemplate);
router.delete('/templates/:id', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), deleteOfferTemplate);
// ─── OFFER LETTER CRUD ─────────────────────────────────────────────
router.post('/create', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), createOfferLetter);
router.put('/:id', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateOfferLetter);
router.post('/:id/sign', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), signOfferLetter);
router.post('/:id/send', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), sendOfferLetter);
// ─── OFFER VIEWS ───────────────────────────────────────────────────
router.get('/company/list', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getCompanyOffers);
router.get('/:id', requireCompanyRoleOrJobSeeker([ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER]), getOfferDetails);
router.get('/:id/download', requireCompanyRoleOrJobSeeker([ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER]), downloadOfferPDF);
// ─── TRACKING & RESPONSE ───────────────────────────────────────────
router.get('/:id/track', trackOfferEmail);
router.post('/:id/respond', requireCompanyRoleOrJobSeeker([ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR]), respondToOffer);
router.post('/:id/respond-negotiation', requireCompanyRoleOrJobSeeker([ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR]), respondToNegotiation);
export default router;
//# sourceMappingURL=offer.routes.js.map