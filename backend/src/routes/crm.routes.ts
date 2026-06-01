import { Router } from 'express';
import { authenticateCompany, authenticateToken } from '../middleware/auth.middleware.ts';
import {
  getCrmCandidates,
  getCrmCandidateById,
  addCrmCandidate,
  updateCrmCandidate,
  removeCrmCandidate,
  logCrmInteraction,
  getTalentPools,
  createTalentPool,
  updateTalentPool,
  deleteTalentPool,
  getTalentPoolMembers,
  addTalentPoolMembers,
  removeTalentPoolMember,
} from '../controllers/crm.controller.ts';

const router = Router();

// All CRM routes require company auth
router.use(authenticateCompany);

// ── CRM Candidate Profiles ──────────────────────────────────────────
router.get('/candidates', getCrmCandidates);
router.post('/candidates', addCrmCandidate);
router.get('/candidates/:id', getCrmCandidateById);
router.patch('/candidates/:id', updateCrmCandidate);
router.delete('/candidates/:id', removeCrmCandidate);
router.post('/candidates/:id/interactions', logCrmInteraction);

// ── Talent Pools ────────────────────────────────────────────────────
router.get('/talent-pools', getTalentPools);
router.post('/talent-pools', createTalentPool);
router.patch('/talent-pools/:id', updateTalentPool);
router.delete('/talent-pools/:id', deleteTalentPool);
router.get('/talent-pools/:id/members', getTalentPoolMembers);
router.post('/talent-pools/:id/members', addTalentPoolMembers);
router.delete('/talent-pools/:id/members/:memberId', removeTalentPoolMember);

export default router;