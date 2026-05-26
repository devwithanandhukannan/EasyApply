// src/routes/company.routes.ts  (FULL REPLACEMENT)
import { Router } from 'express';

// Existing job CRUD controllers
import {
  createJob,
  getAllCompanyJobs,
  getJobDetails,
  updateJob,
  deleteJob,
  generateAIDescription,
} from '../controllers/companyJob.controller.ts';

// New dashboard + AI filter controllers
import {
  getCompanyDashboard,
  getJobApplications,
  aiFilterCandidates,
  getCandidateDetail,
  updateApplicationStatus,
} from '../controllers/companyDashboard.controller.ts';

import { authenticateCompany } from '../middleware/auth.middleware.ts';
import { scheduleBulkInterviews, getCompanyInterviewsList, respondToReschedule, updateInterviewStatus } from '../controllers/interview.controller.ts';
import {
  inviteTeamMember,
  listTeamMembers,
  updateMemberRole,
  removeTeamMember,
  acceptInvite,
  setPasswordForInvite
} from '../controllers/team.controller.ts';


const router = Router();

router.get('/team/accept-invite', acceptInvite);

router.use(authenticateCompany);

router.get('/dashboard', getCompanyDashboard);


router.post('/team/invite', inviteTeamMember);
router.get('/team', listTeamMembers);
router.put('/team/:memberId/role', updateMemberRole);
router.delete('/team/:memberId', removeTeamMember);
router.post('/team/set-password', setPasswordForInvite);


router.post('/', createJob);
router.get('/', getAllCompanyJobs);
router.post('/generate-description', generateAIDescription);
router.get('/:id', getJobDetails);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);


router.get('/:jobId/applications', getJobApplications);
router.post('/:jobId/ai-filter', aiFilterCandidates);
router.get('/applications/:applicationId', getCandidateDetail);
router.patch('/applications/:applicationId/status', updateApplicationStatus);
router.post('/interviews/bulk-schedule', scheduleBulkInterviews);
router.get('/interviews/list', getCompanyInterviewsList);

router.post('/interviews/:id/respond-reschedule', respondToReschedule);
router.post('/interviews/:id/update-status', updateInterviewStatus);





export default router;