import './observability/tracer'; // OpenTelemetry MUST initialize before Express/modules
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { globalLimiter, ipBlacklistHandler, trackSecurityFailures } from './middlewares/security';
import { metricsMiddleware, metricsHandler, recordPageViewHandler, requestIdMiddleware } from './middlewares/metrics';
import { httpLoggerMiddleware, logger } from './observability/logger';

// Load environment variables FIRST
dotenv.config();

// Validate Critical Environment Variables on Startup
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`❌ CRITICAL STARTUP ERROR: Environment variable "${key}" is not set.`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed CORS Origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

// CORS Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => 
      origin === allowed || origin.endsWith('.localhost:3000') || (allowed && origin.startsWith(allowed))
    );

    if (isAllowed || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

// Request ID Tracing Middleware (Must run first for request correlation)
app.use(requestIdMiddleware);

// Structured JSON Logging Middleware with PII redaction and trace correlation
app.use(httpLoggerMiddleware);

// Security & Parsing Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(ipBlacklistHandler);
app.use(globalLimiter);
app.use(trackSecurityFailures);
app.use(metricsMiddleware);

// ─── Prometheus Metrics Scraping Endpoint ───────────────────────────────────
app.get('/metrics', metricsHandler);

// ─── Frontend Page-View Analytics Ingestion ──────────────────────────────────
app.post('/api/v1/analytics/page-view', recordPageViewHandler);
app.post('/api/analytics/page-view', recordPageViewHandler);

// ─── Health & Keep-Alive / Wake-up Endpoints (Bypasses rate limiting) ───────
const healthCheckHandler = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'LVMS Backend API',
    message: 'Server is awake and active 🚀',
  });
};

app.get('/health', healthCheckHandler);
app.get('/ping', healthCheckHandler);
app.get('/api', healthCheckHandler);
app.get('/api/v1', healthCheckHandler);
app.get('/api/health', healthCheckHandler);
app.get('/api/v1/health', healthCheckHandler);

// Root Endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'Loan Verification Management System API',
    timestamp: new Date().toISOString(),
    healthEndpoint: '/health',
  });
});

// API Routes (support both /api and /api/v1 prefixes)
app.use('/api/v1', routes);
app.use('/api', routes);

// Global Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, req_id: req.headers['x-request-id'] }, 'Unhandled Application Error');
  res.status(500).json({ success: false, message: 'Internal Server Error', error: process.env.NODE_ENV === 'production' ? undefined : err.message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

