import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';

import env from './config/env';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import serviceRoutes from './routes/services';
import bookingRoutes from './routes/bookings';
import paymentRoutes from './routes/payments';
import webhookRoutes from './routes/webhooks';
import errorHandler from './middleware/errorHandler';
// Import eventEmitter to ensure all email listeners are registered at startup
import './utils/eventEmitter';

// Connect to MongoDB
connectDB();

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet()); // Sets secure HTTP headers

app.use(
  cors({
    origin:
      env.NODE_ENV === 'development'
        ? [env.CLIENT_URL, /^http:\/\/localhost:\d+$/]
        : env.CLIENT_URL,
    credentials: true,
  })
);

// Rate limiting on auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'development' ? 100 : 10, // higher limit for testing locally
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Webhooks (Must be before JSON parser) ───────────────────────────────
app.use('/api/webhooks', webhookRoutes);

// ─── Body Parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Sanitize data against NoSQL injection attacks (custom for Express 5 compatibility)
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/services', apiLimiter, serviceRoutes);
app.use('/api/bookings', apiLimiter, bookingRoutes);
app.use('/api/payments', apiLimiter, paymentRoutes);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'EventBook API is running', timestamp: new Date() });
});

// 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────
const PORT = parseInt(env.PORT);
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📌 Environment: ${env.NODE_ENV}`);
});

export default app;
