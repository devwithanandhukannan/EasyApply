// src/routes/publicJobs.routes.ts
import express from 'express';
import { optionalAuth } from '../middleware/auth.middleware.ts';
import {
  getPublicJobs,
  getPublicJobDetails,
} from '../controllers/publicJobs.controller.ts';
import {
  getPublicCompanyProfile,
  getPublicCompanyJobs,
  getPublicJobDetails as getPublicCompanyJobDetails,
  getCurrentUser,
  getAllPublicCompanies,
  searchAllJobs
} from '../controllers/publicCompany.controller.ts';

const router = express.Router();

// ─── PUBLIC ROUTES (No authentication required, but user info attached if logged in) ───
router.use(optionalAuth); // Apply optional auth to all routes

// Company routes
router.get('/companies', getAllPublicCompanies);
router.get('/companies/:identifier', getPublicCompanyProfile);
router.get('/companies/:identifier/jobs', getPublicCompanyJobs);

// Job routes
router.get('/jobs', searchAllJobs);
router.get('/jobs/:jobId', getPublicCompanyJobDetails);

// User session
router.get('/auth/me', getCurrentUser);

// Legacy routes (keeping for backward compatibility)
router.get('/public', getPublicJobs);
router.get('/public/:id', getPublicJobDetails);

export default router;