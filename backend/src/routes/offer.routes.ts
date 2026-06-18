import express from 'express';
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

// ─── AI GENERATION ─────────────────────────────────────────────────
router.post('/templates/generate-ai', generateTemplateWithAI);

// ─── TEMPLATE MANAGEMENT ───────────────────────────────────────────
router.post('/templates', createOfferTemplate);
router.get('/templates', getCompanyTemplates);
router.put('/templates/:id', updateOfferTemplate);
router.delete('/templates/:id', deleteOfferTemplate);

// ─── OFFER LETTER CRUD ─────────────────────────────────────────────
router.post('/create', createOfferLetter);
router.put('/:id', updateOfferLetter);
router.post('/:id/sign', signOfferLetter);
router.post('/:id/send', sendOfferLetter);

// ─── OFFER VIEWS ───────────────────────────────────────────────────
router.get('/company/list', getCompanyOffers);
router.get('/:id', getOfferDetails);
router.get('/:id/download', downloadOfferPDF);

// ─── TRACKING & RESPONSE ───────────────────────────────────────────
router.get('/:id/track', trackOfferEmail);
router.post('/:id/respond', respondToOffer);
router.post('/:id/respond-negotiation', respondToNegotiation);

export default router;