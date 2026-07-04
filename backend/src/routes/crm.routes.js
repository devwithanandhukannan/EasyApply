// src/routes/crm.routes.ts
import { Router } from 'express';
import { authenticateCompany, requireCompanyRole } from '../middleware/auth.middleware.ts';
import { ROLES } from '../constants/roles.ts';
import { getCrmCandidates, getCrmCandidateById, addCrmCandidate, updateCrmCandidate, removeCrmCandidate, logCrmInteraction, getTalentPools, createTalentPool, updateTalentPool, deleteTalentPool, getTalentPoolMembers, addTalentPoolMembers, removeTalentPoolMember, } from '../controllers/crm.controller.ts';
const router = Router();
// Secure all endpoints under workspace context verification
router.use(authenticateCompany);
// ── CRM Candidate Profiles ──────────────────────────────────────────
router.get('/candidates', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER), getCrmCandidates);
router.post('/candidates', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), addCrmCandidate);
router.get('/candidates/:id', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER), getCrmCandidateById);
router.patch('/candidates/:id', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateCrmCandidate);
router.delete('/candidates/:id', requireCompanyRole(ROLES.COMPANY_ADMIN), removeCrmCandidate);
router.post('/candidates/:id/interactions', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER), logCrmInteraction);
// ── Talent Pools ────────────────────────────────────────────────────
router.get('/talent-pools', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER, ROLES.COMPANY_INTERVIEWER), getTalentPools);
router.post('/talent-pools', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), createTalentPool);
router.patch('/talent-pools/:id', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateTalentPool);
router.delete('/talent-pools/:id', requireCompanyRole(ROLES.COMPANY_ADMIN), deleteTalentPool);
router.get('/talent-pools/:id/members', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER, ROLES.COMPANY_INTERVIEWER), getTalentPoolMembers);
router.post('/talent-pools/:id/members', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), addTalentPoolMembers);
router.delete('/talent-pools/:id/members/:memberId', requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), removeTalentPoolMember);
export default router;
//# sourceMappingURL=crm.routes.js.map