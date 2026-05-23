// src/index.ts  (complete updated file)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.ts';
import jobseekerRoutes from './routes/jobseeker.routes.ts';
import resumeRoutes from './routes/resume.routes.ts';
import companyAuthRoutes from './routes/companyAuth.routes.ts';

const app = express();
app.use(cookieParser());
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, or server-to-server calls)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS context'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/jobseeker', jobseekerRoutes);
app.use('/api/jobseeker/resumes', resumeRoutes);
app.use('/api/company/auth', companyAuthRoutes);

app.get('/', (_req, res) => res.send('Backend Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ─── .env additions needed ────────────────────────────────────────────────
// GROQ_API_KEY=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
// RESUME_UPLOAD_DIR=/var/interviewer/uploads/resumes   (optional, defaults to above)
// ─────────────────────────────────────────────────────────────────────────