// src/routes/jobseeker.routes.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  authenticateToken, 
  requireJobSeeker,
} from '../middleware/auth.middleware.ts';
import { getProfile, updateProfile } from '../controllers/profile.controller.ts';
import { upload as profileUpload } from '../utils/multer.ts';
import {
  uploadAndAnalyze,
  generateCV,
  convertResumeToHTML,
  optimizeResume,
  getKeywordSuggestions,
  getAllResumes,
  getResumeById,
  updateResume,
  restoreVersion,
  deleteResume,
  downloadResume,
} from '../controllers/resume.controller.ts';
import {
  applyToJob,
  getMyApplications,
  getApplicationDetails,
  withdrawApplication,
} from '../controllers/application.controller.ts';
import {
  getPublicJobs,
  getPublicJobDetails,
} from '../controllers/publicJobs.controller.ts';
import {
  getMyScheduledInterviews,
  confirmInterviewPresence,
  requestInterviewReschedule,
} from '../controllers/interview.controller.ts';
import { getApplicationsTracker, getSingleApplicationDetails, updateApplicationNotes, withdrawApplicationTracker } from '../controllers/applicationTracker.controller.ts';
import offerRoutes from './offer.routes.ts';
import { getJobSeekerDashboard, getApplicationInsights } from '../controllers/jobseekerDashboard.controller.ts';
import {getSalaryComparison} from '../controllers/offer.controller.ts';
import { saveNotificationToken } from '../controllers/notification.controller.ts';
import { SpotJobController } from '../controllers/spotJob.controller.ts';

const router = express.Router();

// ─── PUBLIC ROUTES (No authentication) ───────────────────────────────────
router.get('/jobs/public', getPublicJobs);
router.get('/jobs/public/:id', getPublicJobDetails);

// ─── AUTHENTICATED JOB SEEKER ROUTES ─────────────────────────────────────
router.use(authenticateToken);
router.use(requireJobSeeker);

// ─── PROFILE MANAGEMENT ──────────────────────────────────────────────────
router.get('/profile', getProfile);
router.put('/profile', profileUpload.single('profileImage'), updateProfile);

// ─── RESUME STORAGE CONFIGURATION ────────────────────────────────────────
const UPLOAD_DIR = process.env.RESUME_UPLOAD_DIR ?? 
  path.join(process.cwd(), 'uploads/resumes');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const resumeUpload = multer({
  storage: resumeStorage,
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF/DOCX allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ─── RESUME MANAGEMENT ───────────────────────────────────────────────────
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
router.get('/resumes/:id/download', downloadResume);

// ─── APPLICATION MANAGEMENT ──────────────────────────────────────────────
router.post('/applications/apply', resumeUpload.single('newResume'), applyToJob);
router.get('/applications', getMyApplications);
router.get('/applications/:applicationId', getApplicationDetails);
router.delete('/applications/:id', withdrawApplication);

// ─── INTERVIEW WORKFLOW ──────────────────────────────────────────────────
router.get('/interviews', getMyScheduledInterviews);
router.post('/interviews/:id/confirm', confirmInterviewPresence);
router.post('/interviews/:id/reschedule', requestInterviewReschedule);


// ─── APPLICATION TRACKER ─────────────────────────────────────────────────
router.get('/applications/tracker/timeline', getApplicationsTracker);
router.get('/tracker/:applicationId', authenticateToken, getSingleApplicationDetails);
router.patch('/applications/:id/notes', updateApplicationNotes);
router.post('/applications/:id/withdraw', withdrawApplicationTracker);

router.use('/offers', offerRoutes);

router.get('/dashboard', getJobSeekerDashboard);
router.get('/insights', getApplicationInsights);

router.get('/salary-compare', getSalaryComparison);


router.post('/notification/token', saveNotificationToken);

//spot job seeker routes
router.get('/spot-jobs/invitations', authenticateToken, requireJobSeeker, SpotJobController.getJobSeekerInvitations);
router.patch('/spot-jobs/respond/:bookingId', authenticateToken, requireJobSeeker, SpotJobController.respondToBooking);

export default router;