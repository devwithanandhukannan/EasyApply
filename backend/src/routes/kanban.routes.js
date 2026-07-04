// src/routes/kanban.routes.ts
import { Router } from 'express';
import { getPipelineBoard, movePipelineCard } from '../controllers/kanban.controller.ts';
import { authenticateCompany, requireCompanyRole } from '../middleware/auth.middleware.ts';
import { ROLES } from '../constants/roles.ts';
const router = Router();
// Secure entire board interface via middleware pipeline
router.use(authenticateCompany);
router.get('/job/:jobPostingId', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getPipelineBoard);
router.patch('/move-card', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), movePipelineCard);
export default router;
//# sourceMappingURL=kanban.routes.js.map