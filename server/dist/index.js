"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./observability/tracer"); // OpenTelemetry MUST initialize before Express/modules
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./routes"));
const security_1 = require("./middlewares/security");
const metrics_1 = require("./middlewares/metrics");
const logger_1 = require("./observability/logger");
// Load environment variables FIRST
dotenv_1.default.config();
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
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Allowed CORS Origins
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.CLIENT_URL,
].filter(Boolean);
// CORS Middleware
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin)
            return callback(null, true);
        const isAllowed = allowedOrigins.some(allowed => origin === allowed || origin.endsWith('.localhost:3000') || (allowed && origin.startsWith(allowed)));
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
app.use(metrics_1.requestIdMiddleware);
// Structured JSON Logging Middleware with PII redaction and trace correlation
app.use(logger_1.httpLoggerMiddleware);
// Security & Parsing Middlewares
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(security_1.ipBlacklistHandler);
app.use(security_1.globalLimiter);
app.use(security_1.trackSecurityFailures);
app.use(metrics_1.metricsMiddleware);
// ─── Prometheus Metrics Scraping Endpoint ───────────────────────────────────
app.get('/metrics', metrics_1.metricsHandler);
// ─── Frontend Page-View Analytics Ingestion ──────────────────────────────────
app.post('/api/v1/analytics/page-view', metrics_1.recordPageViewHandler);
app.post('/api/analytics/page-view', metrics_1.recordPageViewHandler);
// ─── Health & Keep-Alive / Wake-up Endpoints (Bypasses rate limiting) ───────
const healthCheckHandler = (req, res) => {
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
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'Loan Verification Management System API',
        timestamp: new Date().toISOString(),
        healthEndpoint: '/health',
    });
});
// API Routes (support both /api and /api/v1 prefixes)
app.use('/api/v1', routes_1.default);
app.use('/api', routes_1.default);
// Global Error Handling Middleware
app.use((err, req, res, next) => {
    logger_1.logger.error({ err, req_id: req.headers['x-request-id'] }, 'Unhandled Application Error');
    res.status(500).json({ success: false, message: 'Internal Server Error', error: process.env.NODE_ENV === 'production' ? undefined : err.message });
});
// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
