// src/routes/selection.routes.ts
import express from 'express';
import { bulkMoveApplications, bulkStarApplications, bulkSetPriority, bulkAddTags, getFilteredApplications, getApplicationDetails, getApplicationTimeline, bulkUpdateApplicationStatus } from '../controllers/selection.controller.ts';
import { requireCompanyRole } from '../middleware/auth.middleware.ts';
import { ROLES } from '../constants/roles.ts';
const router = express.Router();
// ─── 1. BULK OPERATION MUTATIONS (Admin & HR only) ────────────────────────
// router.post(
//   '/bulk/move', 
//   requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), 
//   bulkMoveApplications
// );
router.post('/bulk/star', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), bulkStarApplications);
// router.post(
//   '/bulk/priority', 
//   requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), 
//   bulkSetPriority
// );
// router.post(
//   '/bulk/tags', 
//   requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), 
//   bulkAddTags
// );
// ─── 2. FILTERED READ QUERIES (All valid company accounts can access) ─────
// router.get(
//   '/jobs/:jobPostingId/applications', 
//   requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), 
//   getFilteredApplications
// );
// ─── 3. SINGLE TARGET CANDIDATE PROFILES (Safe and explicit paths) ────────
// Timeline audit trail endpoint
router.get('/applications/:applicationId/timeline', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getApplicationTimeline);
// Deep extraction info details endpoint
router.get('/applications/:applicationId', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getApplicationDetails);
router.patch('/bulk/status', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), bulkUpdateApplicationStatus);
export default router;
//# sourceMappingURL=selection.routes.js.map