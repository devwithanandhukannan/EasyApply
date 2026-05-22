import express from 'express';

import {
  checkMe,
  sendOtp,
  verifyOtp,
} from '../controllers/auth.controller.ts';

import { 
  authenticateToken
} from '../middleware/auth.middleware.ts';

const router = express.Router();

router.post('/send-otp', sendOtp);

router.post('/verify-otp', verifyOtp);

router.get('/me', authenticateToken, checkMe);

export default router;