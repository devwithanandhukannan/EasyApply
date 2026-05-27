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
  resendCompanyVerificationEmail 
} from '../controllers/companyAuth.controller.ts';
import { authenticateCompany } from '../middleware/auth.middleware.ts';

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

// ─── PUBLIC ROUTES ───────────────────────────────────────────────────────
router.post('/send-otp', sendCompanyOtp);
router.post('/verify-otp', verifyCompanyOtp);
router.post('/register', handleLogoUpload, registerCompany);
router.post('/login', companyLogin);
router.get('/verify-email', verifyCompanyEmail);
router.post('/resend-verification', resendCompanyVerificationEmail);

// ─── PROTECTED ROUTES ────────────────────────────────────────────────────
router.get('/session', authenticateCompany, checkCompanySession);

export default router;