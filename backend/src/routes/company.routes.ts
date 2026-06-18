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
import { ROLES } from '../constants/roles.ts';

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
router.use('/offers', offerRoutes);
router.use('/selection', selectionRoutes);
router.use('/interviews-v2', interviewRouter);
router.use('/crm', crmRouter);
router.use('/kanban', kanbanRouter);

// ─── 2. INTERVIEW MANAGEMENT ───────────────────────────────────────────
router.post('/interviews/bulk-schedule', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), scheduleBulkInterviews);
router.get('/interviews/list', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getCompanyInterviewsList);
router.post('/interviews/:id/respond-reschedule', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), respondToReschedule);
router.post('/interviews/:id/update-status', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER), updateInterviewStatus);

// ─── 3. TEAM MANAGEMENT ──────────────────────────────────────────────────
router.post('/team/invite', requireCompanyRole(ROLES.COMPANY_ADMIN), inviteTeamMember);
router.get('/team', listTeamMembers);
router.put('/team/:memberId/role', requireCompanyRole(ROLES.COMPANY_ADMIN), updateMemberRole);
router.delete('/team/:memberId', requireCompanyRole(ROLES.COMPANY_ADMIN), removeTeamMember);

// ─── 4. APPLICATION SELECTION SPECIFICS ──────────────────────────────────
router.get('/applications/:applicationId', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getCandidateDetail);
router.patch('/applications/:applicationId/status', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateApplicationStatus);
router.get('/applications/:id/detail', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getApplicationDetailById);
router.post('/notification/send', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), sendNotificationToUser);

// ─── 5. JOB OPERATIONS & EXPLICIT PATHS FIRST ────────────────────────────
router.post('/jobs/generate-description', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), generateAIDescription);
router.post('/jobs', requireCompanyRole(ROLES.COMPANY_ADMIN), createJob);
router.get('/jobs', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER), getAllCompanyJobs);

// Explicit sub-resource routes must sit ABOVE dynamic dynamic wildcards
router.get('/jobs/:jobId/applications', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER), getJobApplications);
router.post('/jobs/:jobId/ai-filter', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), aiFilterCandidates);

// Dynamic wildcards placed at bottom of the Job block
router.get('/jobs/:id', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER), getJobDetails);
router.put('/jobs/:id', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateJob);
router.delete('/jobs/:id', requireCompanyRole(ROLES.COMPANY_ADMIN), deleteJob);

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
 
export default router;