import { Router } from 'express';
import { adminLogin, getAdminProfile } from '../controllers/adminAuth.controller.ts';
import { adminAuth } from '../middleware/adminAuth.middleware.ts';
import {
  getPlatformStats, listCompanies, getCompanyDetail,
  verifyCompany, updateCompanyFeatures, overrideWalkInRoomMaxQueue, listSeekers
} from '../controllers/admin.controller.ts';
import {
  listPlans, createPlan, updatePlan, deactivatePlan,
  assignSubscription, updateCompanyFeatureOverride
} from '../controllers/adminSubscription.controller.ts';
import {
  getSettings, updatePaymentSettings, testPaymentSettings,
  updateEmailSettings, testEmailSettings, updateAiSettings,
  updateVideoSettings, updateGeneralSettings, updateQueueSettings
} from '../controllers/adminSettings.controller.ts';
import { triggerBatchRecalculation, getBatchJobs } from '../controllers/adminAts.controller.ts';
import { listAllFeatureRequests, updateFeatureRequestStatus } from '../controllers/featureRequest.controller.ts';

const router = Router();

// ─── AUTH (no guard needed) ───────────────────────────────────────────────────
router.post('/auth/login', adminLogin);
router.get('/auth/me', adminAuth, getAdminProfile);

// ─── PLATFORM STATS ───────────────────────────────────────────────────────────
router.get('/stats', adminAuth, getPlatformStats);

// ─── COMPANIES ────────────────────────────────────────────────────────────────
router.get('/companies', adminAuth, listCompanies);
router.get('/companies/:id', adminAuth, getCompanyDetail);
router.put('/companies/:id/verify', adminAuth, verifyCompany);
router.put('/companies/:id/features', adminAuth, updateCompanyFeatures);
router.put('/companies/:companyId/subscription', adminAuth, assignSubscription);
router.put('/companies/:companyId/subscription/features', adminAuth, updateCompanyFeatureOverride);
router.put('/walkin/rooms/:roomId/max-queue', adminAuth, overrideWalkInRoomMaxQueue);

// ─── SEEKERS ──────────────────────────────────────────────────────────────────
router.get('/seekers', adminAuth, listSeekers);

// ─── SUBSCRIPTION PLANS ───────────────────────────────────────────────────────
router.get('/subscriptions', adminAuth, listPlans);
router.post('/subscriptions', adminAuth, createPlan);
router.put('/subscriptions/:id', adminAuth, updatePlan);
router.delete('/subscriptions/:id', adminAuth, deactivatePlan);

// ─── COMPANY FEATURE REQUESTS ─────────────────────────────────────────────────
router.get('/feature-requests', adminAuth, listAllFeatureRequests);
router.put('/feature-requests/:id/status', adminAuth, updateFeatureRequestStatus);

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
router.get('/settings', adminAuth, getSettings);
router.put('/settings/payment', adminAuth, updatePaymentSettings);
router.post('/settings/payment/test', adminAuth, testPaymentSettings);
router.put('/settings/email', adminAuth, updateEmailSettings);
router.post('/settings/email/test', adminAuth, testEmailSettings);
router.put('/settings/ai', adminAuth, updateAiSettings);
router.put('/settings/video', adminAuth, updateVideoSettings);
router.put('/settings/general', adminAuth, updateGeneralSettings);
router.put('/settings/queue', adminAuth, updateQueueSettings);

// ─── ATS BATCH RECALCULATION ──────────────────────────────────────────────────
router.post('/ats/recalculate/:jobPostingId', adminAuth, triggerBatchRecalculation);
router.get('/ats/jobs', adminAuth, getBatchJobs);

export default router;
