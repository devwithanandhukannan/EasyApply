// src/routes/companyJob.routes.ts
import { Router } from 'express';
import { 
  createJob, 
  getAllCompanyJobs, 
  getJobDetails, 
  updateJob, 
  deleteJob, 
  generateAIDescription 
} from '../controllers/companyJob.controller.ts';

// BUG FIX: Import authenticateCompany instead of authenticateToken
import { authenticateCompany } from '../middleware/auth.middleware.ts';
const router = Router();

// BUG FIX: Protect all company routes with company authentication
router.use(authenticateCompany);

// Job management routes
router.post('/', createJob);
router.get('/', getAllCompanyJobs);
router.post('/generate-description', generateAIDescription);
router.get('/:id', getJobDetails);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

export default router;