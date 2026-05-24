import express from 'express'; // 👈 Default import handles the runtime safely
import type { Request, Response, NextFunction } from 'express'; // 👈 'import type' completely strips this out during build compilation
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
import { authenticateToken } from '../middleware/auth.middleware.ts';

const router = express.Router();

// Configure multer to store uploaded files entirely in transient RAM memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 5 * 1024 * 1024 // Caps image uploads at 5MB maximum
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image formats are supported.'));
    }
  },
});

/**
 * Middleware wrapper to safely catch Multer validation errors
 */
const handleLogoUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('logo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `File upload restriction violated: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// ─── OTP FLOWS ───────────────────────────────────────────────────────────
router.post('/send-otp', sendCompanyOtp);
router.post('/verify-otp', verifyCompanyOtp);

// ─── AUTHENTICATION FLOWS ────────────────────────────────────────────────
router.post('/register', handleLogoUpload, registerCompany);
router.post('/login', companyLogin);

// ─── VERIFICATION & SESSION MANAGEMENT ──────────────────────────────────
router.get('/verify-email', verifyCompanyEmail);
router.post('/resend-verification', resendCompanyVerificationEmail);
router.get('/session', authenticateToken, checkCompanySession);

export default router;