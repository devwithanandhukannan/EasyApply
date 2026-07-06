import { Router } from 'express';
import { getCompanyToken, getJobSeekerToken } from '../controllers/livekit.controller.ts';
import { 
  authenticateCompany, 
  authenticateToken, 
  requireJobSeeker, 
  requireCompanyRole 
} from '../middleware/auth.middleware.ts';
import { ROLES } from '../constants/roles.ts';
import { 
  addInterviewFeedback, 
  getInterviewFeedbacksList, 
  requestReschedule,
  upsertInterviewFeedback,
  updateInterviewFeedback, 
  getInterviewFeedbackByCandidate
} from '../controllers/interview.controller.ts';

const router = Router();

router.post('/:id/token/company', authenticateCompany, getCompanyToken);
router.post('/:id/token/jobseeker', authenticateToken, requireJobSeeker, getJobSeekerToken);

// Accept security logs from proctored frontend
router.post('/:id/security-logs', (req, res) => {
  res.status(200).json({ success: true });
});

// Feedback submit — Admin, HR, Interviewer only (Viewer blocked in controller too)
router.post(
  '/:interviewId/feedback',
  authenticateCompany,
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER),
  addInterviewFeedback
);

// Feedback upsert — Admin, HR, Interviewer only
router.put(
  '/:interviewId/feedback',
  authenticateCompany,
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER),
  upsertInterviewFeedback
);

// Feedback list — all company roles can view
router.get(
  '/:interviewId/feedback',
  authenticateCompany,
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER),
  getInterviewFeedbacksList
);

router.post('/:interviewId/reschedule', authenticateToken, requestReschedule);
// Update existing feedback block
router.put(
  '/interviews/:interviewId/feedback',
  authenticateCompany,
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER),
  updateInterviewFeedback
);

// Extract feedback using cross-referenced Candidate application keys
router.get(
  '/candidates/:userId/applications/:applicationId/feedback',
  authenticateCompany,
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER),
  getInterviewFeedbackByCandidate
);

export default router;