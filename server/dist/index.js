"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./routes"));
const security_1 = require("./middlewares/security");
// Load environment variables FIRST
dotenv_1.default.config();
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
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.localhost:3000')) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive in dev mode for smooth development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));
// Security & Parsing Middlewares
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(security_1.ipBlacklistHandler);
app.use(security_1.globalLimiter);
app.use(security_1.trackSecurityFailures);
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
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: process.env.NODE_ENV === 'production' ? undefined : err.message });
});
// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
