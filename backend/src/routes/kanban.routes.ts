import { Router } from 'express';
import { getPipelineBoard, movePipelineCard} from '../controllers/kanban.controller.ts';

const router = Router();

router.get('/job/:jobPostingId', getPipelineBoard);
router.patch('/move-card', movePipelineCard);
// router.post('/schedule-interview', scheduleInterviewTransition);

export default router;