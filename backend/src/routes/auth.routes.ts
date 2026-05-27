// src/routes/auth.routes.ts
import express from 'express';
import { 
  checkMe, 
  sendOtp, 
  verifyOtp, 
  logoutUser 
} from '../controllers/auth.controller.ts';
import { authenticateToken } from '../middleware/auth.middleware.ts';

const router = express.Router();

// Public routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/logout', logoutUser);

// Protected routes
router.get('/me', authenticateToken, checkMe);

export default router;