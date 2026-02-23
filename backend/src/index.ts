import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import adminRoutes from './routes/admin.routes';
import voiceRoutes from './routes/voice.routes';
import { errorHandler } from './middleware';
import prisma from './prisma';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// 1. Security Headers (Helmet) & CORS
app.use(helmet());
app.use(cors());

// 2. Body Parsing
app.use(express.json({ limit: '10mb' }) as any);
app.use(express.urlencoded({ extended: true }) as any);

// 3. Request Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// 4. Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. API Routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/admin', adminRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api', routes);

// 6. Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', version: '1.2.0', env: process.env.NODE_ENV });
});

// 7. Global Error Handler
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`🛡️ BioShield Enterprise Backend listening on port ${port}`);
});

// Graceful Shutdown
async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully...`);
  try {
    await prisma.$disconnect();
    console.log('Database disconnected');
  } catch (err) {
    console.error('Error during database disconnect:', err);
  }

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));