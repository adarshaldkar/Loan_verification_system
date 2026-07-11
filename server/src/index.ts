import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { globalLimiter, ipBlacklistHandler, trackSecurityFailures } from './middlewares/security';

// Load environment variables FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting support (e.g. Loopback/DDoS protection)
app.set('trust proxy', 1);

// Security & Parsing Middlewares
app.use(ipBlacklistHandler); // Block blacklisted IPs immediately
app.use(trackSecurityFailures); // Track security failures to detect DDoS/scanning
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'lvms-default-secure-secret-key'));
app.use(globalLimiter);

// API Routes (all routes prefixed with /api/v1)
app.use('/api/v1', routes);

// Global Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: process.env.NODE_ENV === 'production' ? undefined : err.message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

