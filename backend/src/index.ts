// 1. Import and load dotenv immediately
import 'dotenv/config';

// 2. Import other dependencies
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.ts';
import cookieParser from 'cookie-parser';
import jobseekerRoutes from './routes/jobseeker.routes.ts';



const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: 'http://localhost:3000', // Explicitly allow your frontend client origin
    credentials: true,               // Essential: Allows the browser to accept and send back cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/jobseeker', jobseekerRoutes);

app.get('/', (_, res) => {
  res.send('Backend Running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});