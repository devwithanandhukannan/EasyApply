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

const app = express();
app.use(cookieParser());

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS context'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '10mb' }));

// ─── API ROUTER REGISTER (ORDER MATTERS!) ───
// Auth routes first
app.use('/api/auth', authRoutes);
app.use('/api/company/auth', companyAuthRoutes);

// Protected routes
app.use('/api/jobseeker', jobseekerRoutes);
app.use('/api/company', companyJobRoutes);
app.use('/api/interviews', interviewRouter);
app.use('/api/kanban', kanbanRouter);
app.use('/api/crm', crmRoutes);

// Public routes last (to avoid conflicts)
app.use('/api/public', publicJobRoutes);

app.get('/', (_req, res) => res.send('Backend Running'));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));