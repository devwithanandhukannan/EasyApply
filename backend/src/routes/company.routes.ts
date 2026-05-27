// src/routes/company.routes.ts
import { Router } from 'express';
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

const router = Router();

// ─── PUBLIC COMPANY ROUTES ───────────────────────────────────────────────
router.post('/team/set-password', setTeamMemberPassword);
router.get('/team/accept-invite', acceptInvite);
router.post('/team/login', teamMemberLogin);

// ─── PROTECTED COMPANY ROUTES (All require company authentication) ───────
router.use(authenticateCompany);

// Dashboard (all company members can view)
router.get('/dashboard', getCompanyDashboard);

// ─── TEAM MANAGEMENT (Admin only) ────────────────────────────────────────
router.post(
  '/team/invite',
  requireCompanyRole(ROLES.COMPANY_ADMIN),
  inviteTeamMember
);
router.get('/team', listTeamMembers);
router.put(
  '/team/:memberId/role',
  requireCompanyRole(ROLES.COMPANY_ADMIN),
  updateMemberRole
);
router.delete(
  '/team/:memberId',
  requireCompanyRole(ROLES.COMPANY_ADMIN),
  removeTeamMember
);

// ─── JOB POSTING MANAGEMENT ──────────────────────────────────────────────
// Create/Delete: Admin only
router.post(
  '/',
  requireCompanyRole(ROLES.COMPANY_ADMIN),
  createJob
);
router.delete(
  '/:id',
  requireCompanyRole(ROLES.COMPANY_ADMIN),
  deleteJob
);

// Update/View: Admin and HR
router.get(
  '/',
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER),
  getAllCompanyJobs
);
router.get(
  '/:id',
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER),
  getJobDetails
);
router.put(
  '/:id',
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR),
  updateJob
);
router.post(
  '/generate-description',
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR),
  generateAIDescription
);

// ─── APPLICATION MANAGEMENT ──────────────────────────────────────────────
router.get(
  '/:jobId/applications',
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER),
  getJobApplications
);
router.post(
  '/:jobId/ai-filter',
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR),
  aiFilterCandidates
);
router.get(
  '/applications/:applicationId',
  requireCompanyRole(
    ROLES.COMPANY_ADMIN,
    ROLES.COMPANY_HR,
    ROLES.COMPANY_INTERVIEWER,
    ROLES.COMPANY_VIEWER
  ),
  getCandidateDetail
);
router.patch(
  '/applications/:applicationId/status',
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR),
  updateApplicationStatus
);

// ─── INTERVIEW MANAGEMENT ────────────────────────────────────────────────
router.post(
  '/interviews/bulk-schedule',
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR),
  scheduleBulkInterviews
);
router.get(
  '/interviews/list',
  requireCompanyRole(
    ROLES.COMPANY_ADMIN,
    ROLES.COMPANY_HR,
    ROLES.COMPANY_INTERVIEWER,
    ROLES.COMPANY_VIEWER
  ),
  getCompanyInterviewsList
);
router.post(
  '/interviews/:id/respond-reschedule',
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR),
  respondToReschedule
);
router.post(
  '/interviews/:id/update-status',
  requireCompanyRole(
    ROLES.COMPANY_ADMIN,
    ROLES.COMPANY_HR,
    ROLES.COMPANY_INTERVIEWER
  ),
  updateInterviewStatus
);

export default router;