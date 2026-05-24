// src/routes/auth.routes.ts
import express from 'express';
import { checkMe, sendOtp, verifyOtp, logoutUser } from '../controllers/auth.controller.ts';
import { authenticateToken } from '../middleware/auth.middleware.ts';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.get('/me', authenticateToken, checkMe);
router.post('/logout', logoutUser);

export default router;