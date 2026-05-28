import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.ts';
import {
  createOfferTemplate,
  getCompanyTemplates,
  updateOfferTemplate,
  deleteOfferTemplate,
  createOfferLetter,
  signOfferLetter,
  sendOfferLetter,
  trackOfferEmail,
  respondToOffer,
  getCompanyOffers,
  getOfferDetails,
  downloadOfferPDF
} from '../controllers/offer.controller.ts';

const router = express.Router();

// ─── PUBLIC TRACKING ENDPOINT (NO AUTH) ────────────────────────────
router.get('/:id/track', trackOfferEmail);

// ─── AUTHENTICATED ROUTES ───────────────────────────────────────────
router.use(authenticateToken);

// ─── TEMPLATE MANAGEMENT (COMPANY ONLY) ────────────────────────────
router.post('/templates', createOfferTemplate);
router.get('/templates', getCompanyTemplates);
router.put('/templates/:id', updateOfferTemplate);
router.delete('/templates/:id', deleteOfferTemplate);

// ─── OFFER LETTER MANAGEMENT ────────────────────────────────────────
router.post('/', createOfferLetter);
router.post('/:id/sign', signOfferLetter);
router.post('/:id/send', sendOfferLetter);
router.get('/company/list', getCompanyOffers);
router.get('/:id', getOfferDetails);
router.get('/:id/download', downloadOfferPDF);

// ─── CANDIDATE RESPONSE (JOB SEEKER) ────────────────────────────────
router.post('/:id/respond', respondToOffer);

export default router;