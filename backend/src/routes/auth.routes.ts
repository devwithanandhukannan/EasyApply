// src/routes/auth.routes.ts
import express from 'express';
import { 
  checkMe, 
  sendOtp, 
  verifyOtp, 
  logoutUser,
  checkEmailExists
} from '../controllers/auth.controller.ts';
import { authenticateToken } from '../middleware/auth.middleware.ts';
import { refreshSessionToken } from '../controllers/refreshtoken.controller.ts';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.ts';

const router = express.Router();

// Public routes with rate limiting
router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/logout', logoutUser);
router.post('/refresh', refreshSessionToken);
router.post('/check-email', authLimiter, checkEmailExists);
// Protected routes
router.get('/me', authenticateToken, checkMe);

export default router;