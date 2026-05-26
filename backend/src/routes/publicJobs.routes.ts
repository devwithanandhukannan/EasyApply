// src/routes/publicJobs.routes.ts
import express from 'express';
import {
  getPublicJobs,
  getPublicJobDetails,
} from '../controllers/publicJobs.controller.ts';

const router = express.Router();

// Public routes - no authentication required
router.get('/', getPublicJobs);
router.get('/:id', getPublicJobDetails);

export default router;