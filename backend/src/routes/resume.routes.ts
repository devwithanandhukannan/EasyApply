// src/routes/resume.routes.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth.middleware.ts';
import {
  uploadAndAnalyze, generateCV, convertResumeToHTML,
  optimizeResume, getKeywordSuggestions,
  getAllResumes, getResumeById, updateResume, restoreVersion, deleteResume,
} from '../controllers/resume.controller.ts';

const UPLOAD_DIR = process.env.RESUME_UPLOAD_DIR ?? path.join(process.cwd(), 'uploads/resumes');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF/DOCX allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();
router.use(authenticateToken);

router.post('/upload', upload.single('resume'), uploadAndAnalyze);
router.post('/generate', generateCV);
router.post('/:id/convert', convertResumeToHTML);
router.post('/:id/optimize', optimizeResume);
router.get('/:id/keywords', getKeywordSuggestions);
router.patch('/:id/restore/:versionId', restoreVersion);

router.get('/', getAllResumes);
router.get('/:id', getResumeById);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);

export default router;

// ─── Mount in index.ts ────────────────────────────────────────────────────
// import resumeRoutes from './routes/resume.routes.ts';
// app.use('/api/jobseeker/resumes', resumeRoutes);