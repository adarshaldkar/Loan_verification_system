"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsHandler = exports.metricsMiddleware = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
// Initialize Prometheus Default Metrics (Memory, CPU, Event Loop, GC)
const register = new prom_client_1.default.Registry();
prom_client_1.default.collectDefaultMetrics({ register });
// HTTP Request Duration Histogram
const httpRequestDurationMicroseconds = new prom_client_1.default.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
register.registerMetric(httpRequestDurationMicroseconds);
// HTTP Requests Counter
const httpRequestsTotal = new prom_client_1.default.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests processed',
    labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);
// Middleware to track incoming HTTP requests
const metricsMiddleware = (req, res, next) => {
    // Do not track metrics endpoint itself to prevent loop pollution
    if (req.path === '/metrics') {
        return next();
    }
    const start = process.hrtime();
    res.on('finish', () => {
        const diff = process.hrtime(start);
        const durationInSeconds = diff[0] + diff[1] / 1e9;
        const route = req.baseUrl || req.route?.path || req.path || 'unknown';
        const statusCode = res.statusCode ? res.statusCode.toString() : '500';
        httpRequestDurationMicroseconds
            .labels(req.method, route, statusCode)
            .observe(durationInSeconds);
        httpRequestsTotal
            .labels(req.method, route, statusCode)
            .inc();
    });
    next();
};
exports.metricsMiddleware = metricsMiddleware;
// Handler for the /metrics scraping endpoint
const metricsHandler = async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    }
    catch (err) {
        res.status(500).end(err);
    }
};
exports.metricsHandler = metricsHandler;
