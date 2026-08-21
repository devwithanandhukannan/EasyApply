// src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.ts';
import jobseekerRoutes from './routes/jobseeker.routes.ts';
import companyAuthRoutes from './routes/companyAuth.routes.ts';
import companyJobRoutes from './routes/company.routes.ts';
import publicJobRoutes from './routes/publicJobs.routes.ts'; 
import interviewRouter from './routes/interview.routes.ts';
import kanbanRouter from './routes/kanban.routes.ts';
import crmRoutes from './routes/crm.routes.ts';
import adminRoutes from './routes/admin.routes.ts';
import walkInRoutes from './routes/walkIn.routes.ts';
import { globalLimiter } from './middleware/rateLimiter.ts';

const app = express();
app.use(cookieParser());
app.set('trust proxy', 1);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.workers.dev') ||
        origin.endsWith('.stibe.in') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('192.168.') ||
        origin.includes('10.')
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all valid web contexts
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '10mb' }));

// Apply Global Rate Limiting to all /api endpoints
app.use('/api', globalLimiter);

// ─── API ROUTER REGISTER (ORDER MATTERS!) ───
// Auth routes first
app.use('/api/auth', authRoutes);
app.use('/api/company/auth', companyAuthRoutes);

// Platform admin routes
app.use('/api/admin', adminRoutes);

// Protected routes
app.use('/api/jobseeker', jobseekerRoutes);
app.use('/api/company', companyJobRoutes);
app.use('/api/interviews', interviewRouter);
app.use('/api/kanban', kanbanRouter);
app.use('/api/crm', crmRoutes);

// Walk-in interviews & seeker discovery
app.use('/api/walkin', walkInRoutes);

// Public routes last (to avoid conflicts)
app.use('/api/jobs', publicJobRoutes);
app.use('/api/public', publicJobRoutes);

app.get('/', (_req, res) => res.send('Backend Running'));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));