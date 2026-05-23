import express from 'express';
import multer from 'multer';
import {
  sendCompanyOtp,
  verifyCompanyOtp,
  registerCompany,
  verifyCompanyEmail,
} from '../controllers/companyAuth.controller.ts';

const router = express.Router();

// Memory-backed binary parser to process profile images safely
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit matching your client specifications
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only standard corporate image formats are supported.'));
    }
  },
});

// Post routes reflecting user steps
router.post('/send-otp', sendCompanyOtp);
router.post('/verify-otp', verifyCompanyOtp);
router.post('/register', upload.single('logo'), registerCompany);

// GET path triggered by the Nodemailer confirmation link
router.get('/verify-email', verifyCompanyEmail);

export default router;