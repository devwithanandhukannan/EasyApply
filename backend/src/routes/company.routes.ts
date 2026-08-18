// src/routes/company.routes.ts
import { Router } from 'express';
import multer from 'multer';
import {
  createJob,
  getAllCompanyJobs,
  getJobDetails,
  updateJob,
  deleteJob,
  generateAIDescription,
} from '../controllers/companyJob.controller.ts';
import {
  getCompanyDashboard,
  getJobApplications,
  aiFilterCandidates,
  getCandidateDetail,
  updateApplicationStatus,
} from '../controllers/companyDashboard.controller.ts';
import {
  scheduleBulkInterviews,
  getCompanyInterviewsList,
  respondToReschedule,
  updateInterviewStatus,
  getApplicationDetailById
} from '../controllers/interview.controller.ts';
import {
  inviteTeamMember,
  listTeamMembers,
  updateMemberRole,
  removeTeamMember,
  acceptInvite,
  setTeamMemberPassword,
  teamMemberLogin
} from '../controllers/team.controller.ts';
import { 
  authenticateCompany, 
  requireCompanyRole 
} from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/permission.middleware.ts';
import { ROLES } from '../constants/roles.ts';
import { aiLimiter } from '../middleware/rateLimiter.ts';

// Router mounts
import offerRoutes from './offer.routes.ts';
import selectionRoutes from './selection.routes.ts';
import interviewRouter from './interview.routes.ts';
import crmRouter from './crm.routes.ts';
import kanbanRouter from './kanban.routes.ts';

import { sendNotificationToUser } from '../controllers/notification.controller.ts';
import { 
  getMyCompanyProfile, 
  updateCompanyProfile,
  requestMobileChangeOtp,
  verifyMobileChangeOtp,
  requestEmailChangeOtp,
  verifyEmailChangeOtp,
  updateCompanyPassword,
  updateCompanyLogo
} from '../controllers/companyAuth.controller.ts';
import { SpotJobController } from '../controllers/spotJob.controller.ts';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// ─── PUBLIC COMPANY ROUTES ───────────────────────────────────────────────
router.post('/team/set-password', setTeamMemberPassword);
router.get('/team/accept-invite', acceptInvite);
router.post('/team/login', teamMemberLogin);

// ─── PROTECTED COMPANY ROUTES (All require company authentication) ───────
router.use(authenticateCompany);

// Dashboard
router.get('/dashboard', getCompanyDashboard);

// ─── 1. MOUNTED SUB-ROUTERS ──────────────────────────────────────────────
router.use('/offers', requirePermission('offers', 'read'), offerRoutes);
router.use('/selection', selectionRoutes);
router.use('/interviews-v2', interviewRouter);
router.use('/crm', requirePermission('talent_pool', 'read'), crmRouter);
router.use('/kanban', kanbanRouter);

// ─── 2. INTERVIEW MANAGEMENT ───────────────────────────────────────────
router.post('/interviews/bulk-schedule', requirePermission('interviews', 'schedule'), scheduleBulkInterviews);
router.get('/interviews/list', requirePermission('interviews', 'read'), getCompanyInterviewsList);
router.post('/interviews/:id/respond-reschedule', requirePermission('interviews', 'schedule'), respondToReschedule);
router.post('/interviews/:id/update-status', requirePermission('interviews', 'conduct'), updateInterviewStatus);

// ─── 3. TEAM MANAGEMENT ──────────────────────────────────────────────────
router.post('/team/invite', requirePermission('team', 'invite'), inviteTeamMember);
router.get('/team', requirePermission('team', 'read'), listTeamMembers);
router.put('/team/:memberId/role', requirePermission('team', 'edit'), updateMemberRole);
router.delete('/team/:memberId', requirePermission('team', 'delete'), removeTeamMember);

// ─── 4. APPLICATION SELECTION SPECIFICS ──────────────────────────────────
router.get('/applications/:applicationId', requirePermission('jobs', 'read'), getCandidateDetail);
router.patch('/applications/:applicationId/status', requirePermission('jobs', 'edit'), updateApplicationStatus);
router.get('/applications/:id/detail', requirePermission('jobs', 'read'), getApplicationDetailById);
router.post('/notification/send', requirePermission('jobs', 'edit'), sendNotificationToUser);

// ─── 5. JOB OPERATIONS & EXPLICIT PATHS FIRST ────────────────────────────
router.post('/jobs/generate-description', aiLimiter, requirePermission('jobs', 'create'), generateAIDescription);
router.post('/jobs', requirePermission('jobs', 'create'), createJob);
router.get('/jobs', requirePermission('jobs', 'read'), getAllCompanyJobs);

// Explicit sub-resource routes must sit ABOVE dynamic dynamic wildcards
router.get('/jobs/:jobId/applications', requirePermission('jobs', 'read'), getJobApplications);
router.post('/jobs/:jobId/ai-filter', aiLimiter, requirePermission('jobs', 'edit'), aiFilterCandidates);

// Dynamic wildcards placed at bottom of the Job block
router.get('/jobs/:id', requirePermission('jobs', 'read'), getJobDetails);
router.put('/jobs/:id', requirePermission('jobs', 'edit'), updateJob);
router.delete('/jobs/:id', requirePermission('jobs', 'delete'), deleteJob);

// ─── 6. PROFILE MANAGEMENT ───────────────────────────────────────────────
router.get('/me', getMyCompanyProfile);
router.patch('/profile', updateCompanyProfile);
router.patch('/profile/password', updateCompanyPassword);
router.patch('/profile/logo', upload.single('logo'), updateCompanyLogo);

router.post('/profile/mobile/request-otp', requestMobileChangeOtp);
router.post('/profile/mobile/verify-otp', verifyMobileChangeOtp);
router.post('/profile/email/request-otp', requestEmailChangeOtp);
router.post('/profile/email/verify-otp', verifyEmailChangeOtp);

// ─── 7. SPOT JOBS ────────────────────────────────────────────────────────
router.post('/spot-jobs', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), SpotJobController.createSpotJob);
router.get('/spot-jobs/company-dashboard', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER), SpotJobController.getCompanySpotDashboard);
router.get('/spot-jobs/:id/bookings', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), SpotJobController.getSpotJobBookings);
router.patch('/spot-jobs/:id/status', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), SpotJobController.updateSpotStatusByCompany);

// ─── 8. BUSINESS FEATURE REQUESTS ────────────────────────────────────────
import { createCompanyFeatureRequest, getMyCompanyFeatureRequests } from '../controllers/featureRequest.controller.ts';
router.post('/feature-requests', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), createCompanyFeatureRequest);
router.get('/feature-requests', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER), getMyCompanyFeatureRequests);

export default router;