"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsHandler = exports.recordPageViewHandler = exports.metricsMiddleware = exports.requestIdMiddleware = exports.redisOperationsTotal = exports.securityEventsTotal = exports.reportGenerationDurationSeconds = exports.excelImportRecordsTotal = exports.excelImportDurationSeconds = exports.caseSubmissionsTotal = exports.gpsPingsTotal = exports.activeUsersGauge = exports.pageWebVitals = exports.pageErrorsTotal = exports.pageRenderDurationSeconds = exports.pageViewsTotal = exports.httpErrorsTotal = exports.httpRequestsTotal = exports.httpRequestDurationSeconds = void 0;
exports.normalizePath = normalizePath;
const prom_client_1 = __importDefault(require("prom-client"));
const crypto_1 = __importDefault(require("crypto"));
// Initialize Prometheus Registry & Default Node.js Runtime Metrics (CPU, Memory, GC, Event Loop)
const register = new prom_client_1.default.Registry();
prom_client_1.default.collectDefaultMetrics({ register });
// Helper to normalize dynamic path parameters (UUIDs, IDs) to prevent high cardinality in Prometheus
function normalizePath(path) {
    if (!path)
        return 'root';
    return path
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
        .replace(/\/\d+/g, '/:id')
        .replace(/\?.*$/, '')
        .trim() || '/';
}
// ─── 1. HTTP API Request & Latency Metrics ───────────────────────────────────
exports.httpRequestDurationSeconds = new prom_client_1.default.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds by method, route, and status code (P50, P95, P99)',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
register.registerMetric(exports.httpRequestDurationSeconds);
exports.httpRequestsTotal = new prom_client_1.default.Counter({
    name: 'http_requests_total',
    help: 'Total count of incoming HTTP requests by method, route, and status code',
    labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(exports.httpRequestsTotal);
exports.httpErrorsTotal = new prom_client_1.default.Counter({
    name: 'http_errors_total',
    help: 'Total count of HTTP 4xx and 5xx errors by route, status code, and error type',
    labelNames: ['method', 'route', 'status_code', 'error_type'],
});
register.registerMetric(exports.httpErrorsTotal);
// ─── 2. Frontend Page-Level Analytics & Core Web Vitals ──────────────────────
exports.pageViewsTotal = new prom_client_1.default.Counter({
    name: 'page_views_total',
    help: 'Total views per application page (most visited vs least visited pages)',
    labelNames: ['page', 'role', 'status'],
});
register.registerMetric(exports.pageViewsTotal);
exports.pageRenderDurationSeconds = new prom_client_1.default.Histogram({
    name: 'page_render_duration_seconds',
    help: 'Client-side render and load duration per page in seconds',
    labelNames: ['page'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
});
register.registerMetric(exports.pageRenderDurationSeconds);
exports.pageErrorsTotal = new prom_client_1.default.Counter({
    name: 'page_errors_total',
    help: 'Total client-side JavaScript and network exceptions grouped by page and error type',
    labelNames: ['page', 'error_type'],
});
register.registerMetric(exports.pageErrorsTotal);
exports.pageWebVitals = new prom_client_1.default.Histogram({
    name: 'page_web_vitals',
    help: 'Core Web Vitals scores reported from real user browsers (LCP, INP, CLS)',
    labelNames: ['page', 'metric_name'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 4],
});
register.registerMetric(exports.pageWebVitals);
exports.activeUsersGauge = new prom_client_1.default.Gauge({
    name: 'active_sessions_count',
    help: 'Live concurrent active user sessions tracked in the system',
    labelNames: ['role'],
});
register.registerMetric(exports.activeUsersGauge);
// ─── 3. LVMS Domain & Business Workflow Metrics ──────────────────────────────
exports.gpsPingsTotal = new prom_client_1.default.Counter({
    name: 'lvms_gps_pings_total',
    help: 'Total GPS location telemetry pings received from active field agents',
    labelNames: ['status'], // 'accepted', 'rejected', 'throttled'
});
register.registerMetric(exports.gpsPingsTotal);
exports.caseSubmissionsTotal = new prom_client_1.default.Counter({
    name: 'lvms_case_submissions_total',
    help: 'Total loan verification questionnaires submitted by field agents',
    labelNames: ['profile_type', 'decision'],
});
register.registerMetric(exports.caseSubmissionsTotal);
exports.excelImportDurationSeconds = new prom_client_1.default.Histogram({
    name: 'lvms_excel_import_duration_seconds',
    help: 'Processing latency for bulk Excel customer imports',
    buckets: [0.5, 1, 2, 5, 10, 30, 60],
});
register.registerMetric(exports.excelImportDurationSeconds);
exports.excelImportRecordsTotal = new prom_client_1.default.Counter({
    name: 'lvms_excel_import_records_total',
    help: 'Count of customer records parsed from bulk Excel uploads',
    labelNames: ['status'], // 'success', 'failed'
});
register.registerMetric(exports.excelImportRecordsTotal);
exports.reportGenerationDurationSeconds = new prom_client_1.default.Histogram({
    name: 'lvms_report_generation_duration_seconds',
    help: 'Time taken to generate official RCU verification reports in seconds',
    labelNames: ['format'], // 'pdf', 'docx'
    buckets: [0.25, 0.5, 1, 2.5, 5, 10, 20],
});
register.registerMetric(exports.reportGenerationDurationSeconds);
exports.securityEventsTotal = new prom_client_1.default.Counter({
    name: 'lvms_security_events_total',
    help: 'Security events such as rate limits, brute-force attempts, and unauthorized access',
    labelNames: ['event_type'], // 'rate_limit', 'failed_login', 'blacklisted_ip'
});
register.registerMetric(exports.securityEventsTotal);
exports.redisOperationsTotal = new prom_client_1.default.Counter({
    name: 'lvms_redis_operations_total',
    help: 'Total Redis cache operations and connections',
    labelNames: ['operation', 'status'], // 'hit', 'miss', 'set', 'error'
});
register.registerMetric(exports.redisOperationsTotal);
// ─── 4. Request ID & Tracing Correlation Middleware ──────────────────────────
const requestIdMiddleware = (req, res, next) => {
    const reqId = req.headers['x-request-id'] || crypto_1.default.randomUUID();
    req.headers['x-request-id'] = reqId;
    res.setHeader('x-request-id', reqId);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
// ─── 5. Middleware to track incoming HTTP requests ───────────────────────────
const metricsMiddleware = (req, res, next) => {
    if (req.path === '/metrics' || req.path === '/health' || req.path === '/ping') {
        return next();
    }
    const start = process.hrtime();
    res.on('finish', () => {
        const diff = process.hrtime(start);
        const durationInSeconds = diff[0] + diff[1] / 1e9;
        const rawRoute = req.baseUrl ? `${req.baseUrl}${req.route?.path || req.path}` : req.route?.path || req.path;
        const route = normalizePath(rawRoute);
        const statusCode = res.statusCode ? res.statusCode.toString() : '500';
        exports.httpRequestDurationSeconds
            .labels(req.method, route, statusCode)
            .observe(durationInSeconds);
        exports.httpRequestsTotal
            .labels(req.method, route, statusCode)
            .inc();
        if (res.statusCode >= 400) {
            const errorType = res.statusCode === 429
                ? 'RATE_LIMITED'
                : res.statusCode === 401 || res.statusCode === 403
                    ? 'AUTH_FAILURE'
                    : res.statusCode >= 500
                        ? 'SERVER_ERROR'
                        : 'CLIENT_ERROR';
            exports.httpErrorsTotal
                .labels(req.method, route, statusCode, errorType)
                .inc();
            if (res.statusCode === 401 || res.statusCode === 403) {
                exports.securityEventsTotal.labels('auth_failure').inc();
            }
            else if (res.statusCode === 429) {
                exports.securityEventsTotal.labels('rate_limited').inc();
            }
        }
    });
    next();
};
exports.metricsMiddleware = metricsMiddleware;
// ─── 6. Handler for Frontend Page Analytics & Web Vitals Ingestion ───────────
const recordPageViewHandler = (req, res) => {
    try {
        const { page, role = 'anonymous', durationMs, error, errorType, webVitals } = req.body || {};
        const normalizedPage = normalizePath(page || '/');
        if (error) {
            exports.pageErrorsTotal
                .labels(normalizedPage, errorType || 'JAVASCRIPT_ERROR')
                .inc();
        }
        else {
            exports.pageViewsTotal
                .labels(normalizedPage, role, 'success')
                .inc();
            if (typeof durationMs === 'number' && durationMs > 0) {
                exports.pageRenderDurationSeconds
                    .labels(normalizedPage)
                    .observe(durationMs / 1000);
            }
            if (webVitals && typeof webVitals === 'object') {
                Object.entries(webVitals).forEach(([metricName, val]) => {
                    if (typeof val === 'number') {
                        exports.pageWebVitals.labels(normalizedPage, metricName).observe(val);
                    }
                });
            }
        }
        res.status(200).json({ success: true });
    }
    catch (err) {
        res.status(200).json({ success: false });
    }
};
exports.recordPageViewHandler = recordPageViewHandler;
// ─── 7. Handler for Prometheus Scraping Endpoint ─────────────────────────────
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
