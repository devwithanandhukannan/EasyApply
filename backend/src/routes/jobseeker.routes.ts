// src/routes/jobseeker.routes.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Bug Fix: Pointing directly to the universal unified auth middleware
import { authenticateToken } from '../middleware/auth.middleware.ts';
import { getProfile, updateProfile } from '../controllers/profile.controller.ts';
import { upload as profileUpload } from '../utils/multer.ts';
import {
  uploadAndAnalyze, generateCV, convertResumeToHTML,
  optimizeResume, getKeywordSuggestions,
  getAllResumes, getResumeById, updateResume, restoreVersion, deleteResume,
} from '../controllers/resume.controller.ts';

const router = express.Router();

// Enforce authentication globally for all nested jobseeker endpoints
router.use(authenticateToken);

// ─── PROFILE ENDPOINTS ───────────────────────────────────────────────────
router.get('/profile', getProfile);
router.put('/profile', profileUpload.single('profileImage'), updateProfile);

// ─── RESUME SYSTEM CONFIGURATION & STORAGE ───────────────────────────────
const UPLOAD_DIR = process.env.RESUME_UPLOAD_DIR ?? path.join(process.cwd(), 'uploads/resumes');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const resumeUpload = multer({
  storage: resumeStorage,
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF/DOCX allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file limit
});

// ─── RESUME ENDPOINTS (Nested clean under /resumes) ──────────────────────
router.post('/resumes/upload', resumeUpload.single('resume'), uploadAndAnalyze);
router.post('/resumes/generate', generateCV);
router.post('/resumes/:id/convert', convertResumeToHTML);
router.post('/resumes/:id/optimize', optimizeResume);
router.get('/resumes/:id/keywords', getKeywordSuggestions);
router.patch('/resumes/:id/restore/:versionId', restoreVersion);

router.get('/resumes', getAllResumes);
router.get('/resumes/:id', getResumeById);
router.put('/resumes/:id', updateResume);
router.delete('/resumes/:id', deleteResume);

export default router;