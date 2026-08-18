// src/routes/companyAuth.routes.ts
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { 
  sendCompanyOtp, 
  verifyCompanyOtp, 
  registerCompany, 
  verifyCompanyEmail, 
  checkCompanySession,
  companyLogin,
  resendCompanyVerificationEmail,
  forgotCompanyPassword,
  resetCompanyPassword
} from '../controllers/companyAuth.controller.ts';
import { authenticateCompany } from '../middleware/auth.middleware.ts';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.ts';

const router = express.Router();

// Configure multer for logo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image formats are supported.'));
    }
  },
});

const handleLogoUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('logo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ 
        success: false, 
        message: `File upload restriction violated: ${err.message}` 
      });
    } else if (err) {
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }
    next();
  });
};

// ─── PUBLIC ROUTES WITH RATE LIMITING ──────────────────────────────────────
router.post('/send-otp', otpLimiter, sendCompanyOtp);
router.post('/verify-otp', authLimiter, verifyCompanyOtp);
router.post('/register', authLimiter, handleLogoUpload, registerCompany);
router.post('/login', authLimiter, companyLogin);
router.get('/verify-email', verifyCompanyEmail);
router.post('/resend-verification', otpLimiter, resendCompanyVerificationEmail);
router.post('/forgot-password', authLimiter, forgotCompanyPassword);
router.post('/reset-password', authLimiter, resetCompanyPassword);

// ─── PROTECTED ROUTES ────────────────────────────────────────────────────
router.get('/session', authenticateCompany, checkCompanySession);

export default router;