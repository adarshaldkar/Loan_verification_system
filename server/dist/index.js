"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const routes_1 = __importDefault(require("./routes"));
// Load environment variables FIRST
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security & Parsing Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' })); // Support larger photo payloads
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Express Rate Limiter Middleware to mitigate sudden traffic DDoS spikes
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per window
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply rate limiter to API routes prefix
app.use('/api/v1', apiLimiter, routes_1.default);
// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});
// Multi-Core Scaling using Node Cluster Module (Triggers when CLUSTER_MODE=true or NODE_ENV=production)
const isClusterMode = process.env.CLUSTER_MODE === 'true' || process.env.NODE_ENV === 'production';
if (isClusterMode && cluster_1.default.isPrimary) {
    const numCPUs = os_1.default.cpus().length;
    console.log(`\n🔥 [Traffic Scaling Master] Primary Master process ${process.pid} is running.`);
    console.log(`⚡ Launching ${numCPUs} multi-threaded Express workers to handle traffic spikes...\n`);
    for (let i = 0; i < numCPUs; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on('exit', (worker) => {
        console.log(`⚠️ Worker process ${worker.process.pid} died. Respawning worker...`);
        cluster_1.default.fork();
    });
}
else {
    app.listen(PORT, () => {
        console.log(`🚀 Express server running on port ${PORT} (Worker PID: ${process.pid})`);
    });
}
