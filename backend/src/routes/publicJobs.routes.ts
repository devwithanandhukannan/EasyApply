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

// ─── LEGACY PUBLIC ROUTES ───
router.get('/public', optionalAuth, getPublicJobs);
router.get('/public/:id', optionalAuth, getPublicJobDetails);

// ─── PUBLIC ROUTES (No authentication required) ───
router.get('/jobs', optionalAuth, getPublicJobs);
router.get('/jobs/:jobId', optionalAuth, getPublicJobDetails);
router.get('/companies', optionalAuth, getAllPublicCompanies);
router.get('/companies/:identifier', optionalAuth, getPublicCompanyProfile);
router.get('/companies/:identifier/jobs', optionalAuth, getPublicCompanyJobs);
router.get('/companies/:identifier/jobs/:jobId', optionalAuth, getPublicCompanyJobDetails);

// Search all jobs (public with optional auth for personalization)
router.get('/search', optionalAuth, searchAllJobs);

// Get single job details by ID
router.get('/:jobId', optionalAuth, getPublicJobDetails);

// User session check
router.get('/auth/me', optionalAuth, getCurrentUser);

// Public subscription plans for landing & pricing pages
import { listPublicPlans } from '../controllers/adminSubscription.controller.ts';
router.get('/plans', listPublicPlans);

export default router;