// src/middleware/rateLimiter.ts
import { rateLimit } from 'express-rate-limit';
import type { Request, Response } from 'express';

// Standardized 429 JSON Error Handler
const createRateLimitHandler = (customMessage: string) => {
  return (req: Request, res: Response, _next: any, options: any) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    return res.status(options.statusCode || 429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: customMessage,
      retryAfter,
    });
  };
};

/**
 * 1. Global API Shield
 * Applied to all incoming /api routes.
 * 500 requests per 15 minutes per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many requests sent from your connection. Please slow down.'),
  skip: (req) => req.method === 'OPTIONS',
});

/**
 * 2. Strict Authentication Guard
 * Applied to login & password reset endpoints.
 * 10 attempts per 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many login attempts. For security reasons, please wait 15 minutes before trying again.'),
  keyGenerator: (req) => {
    const identifier = req.body?.email || req.body?.mobileNumber || '';
    return `${req.ip}_${identifier}`.toLowerCase();
  },
});

/**
 * 3. OTP & SMS Protection
 * Applied to OTP generation and SMS dispatch.
 * 4 requests per 15 minutes.
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 4,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Maximum OTP request limit reached. Please wait 15 minutes before requesting another OTP.'),
  keyGenerator: (req) => {
    const identifier = req.body?.mobileNumber || req.body?.email || req.body?.newMobileNumber || req.body?.newEmail || '';
    return `otp_${req.ip}_${identifier}`.toLowerCase();
  },
});

/**
 * 4. AI Copilot & LLM Resource Protection
 * Applied to Groq AI job descriptions, resume ATS parsing, and candidate filtering.
 * 10 requests per minute per user or company.
 */
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('AI copilot usage limit reached for this minute. Please wait 60 seconds.'),
  keyGenerator: (req: any) => {
    return (req.user?.userId || req.company?.companyId || req.ip || 'anonymous').toString();
  },
});

/**
 * 5. LiveKit & WebRTC Signaling Token Throttle
 * Applied to meeting token generation and walk-in queue joins.
 * 20 requests per minute.
 */
export const livekitLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many video session connection requests. Please wait a moment.'),
  keyGenerator: (req: any) => {
    return (req.user?.userId || req.company?.companyId || req.ip || 'anonymous').toString();
  },
});

/**
 * 6. Public Scraping Shield
 * Applied to public job listings and open room info.
 * 60 requests per minute per IP.
 */
export const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many requests. Please slow down and try again.'),
});
