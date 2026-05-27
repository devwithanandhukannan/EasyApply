import { Router } from 'express';
import { getCompanyToken, getJobSeekerToken } from '../controllers/livekit.controller.ts';
import { authenticateCompany, authenticateToken, requireJobSeeker } from '../middleware/auth.middleware.ts';
import { addInterviewFeedback, getInterviewFeedbacksList } from '../controllers/interview.controller.ts';

const router = Router();

router.post('/:id/token/company', authenticateCompany, getCompanyToken);
router.post('/:id/token/jobseeker', authenticateToken, requireJobSeeker, getJobSeekerToken);
router.post('/:interviewId/feedback', authenticateCompany, addInterviewFeedback);
router.get('/:interviewId/feedback', authenticateCompany, getInterviewFeedbacksList);

export default router;