import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import crypto from 'crypto';

// Initialize Prometheus Registry & Default Node.js Runtime Metrics (CPU, Memory, GC, Event Loop)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Helper to normalize dynamic path parameters (UUIDs, IDs) to prevent high cardinality in Prometheus
export function normalizePath(path: string): string {
  if (!path) return 'root';
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+/g, '/:id')
    .replace(/\?.*$/, '')
    .trim() || '/';
}

// ─── 1. HTTP API Request & Latency Metrics ───────────────────────────────────
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds by method, route, and status code (P50, P95, P99)',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
register.registerMetric(httpRequestDurationSeconds);

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total count of incoming HTTP requests by method, route, and status code',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

export const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total count of HTTP 4xx and 5xx errors by route, status code, and error type',
  labelNames: ['method', 'route', 'status_code', 'error_type'],
});
register.registerMetric(httpErrorsTotal);

// ─── 2. Frontend Page-Level Analytics & Core Web Vitals ──────────────────────
export const pageViewsTotal = new client.Counter({
  name: 'page_views_total',
  help: 'Total views per application page (most visited vs least visited pages)',
  labelNames: ['page', 'role', 'status'],
});
register.registerMetric(pageViewsTotal);

export const pageRenderDurationSeconds = new client.Histogram({
  name: 'page_render_duration_seconds',
  help: 'Client-side render and load duration per page in seconds',
  labelNames: ['page'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
});
register.registerMetric(pageRenderDurationSeconds);

export const pageErrorsTotal = new client.Counter({
  name: 'page_errors_total',
  help: 'Total client-side JavaScript and network exceptions grouped by page and error type',
  labelNames: ['page', 'error_type'],
});
register.registerMetric(pageErrorsTotal);

export const pageWebVitals = new client.Histogram({
  name: 'page_web_vitals',
  help: 'Core Web Vitals scores reported from real user browsers (LCP, INP, CLS)',
  labelNames: ['page', 'metric_name'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 4],
});
register.registerMetric(pageWebVitals);

export const activeUsersGauge = new client.Gauge({
  name: 'active_sessions_count',
  help: 'Live concurrent active user sessions tracked in the system',
  labelNames: ['role'],
});
register.registerMetric(activeUsersGauge);

// ─── 3. LVMS Domain & Business Workflow Metrics ──────────────────────────────
export const gpsPingsTotal = new client.Counter({
  name: 'lvms_gps_pings_total',
  help: 'Total GPS location telemetry pings received from active field agents',
  labelNames: ['status'], // 'accepted', 'rejected', 'throttled'
});
register.registerMetric(gpsPingsTotal);

export const caseSubmissionsTotal = new client.Counter({
  name: 'lvms_case_submissions_total',
  help: 'Total loan verification questionnaires submitted by field agents',
  labelNames: ['profile_type', 'decision'],
});
register.registerMetric(caseSubmissionsTotal);

export const excelImportDurationSeconds = new client.Histogram({
  name: 'lvms_excel_import_duration_seconds',
  help: 'Processing latency for bulk Excel customer imports',
  buckets: [0.5, 1, 2, 5, 10, 30, 60],
});
register.registerMetric(excelImportDurationSeconds);

export const excelImportRecordsTotal = new client.Counter({
  name: 'lvms_excel_import_records_total',
  help: 'Count of customer records parsed from bulk Excel uploads',
  labelNames: ['status'], // 'success', 'failed'
});
register.registerMetric(excelImportRecordsTotal);

export const reportGenerationDurationSeconds = new client.Histogram({
  name: 'lvms_report_generation_duration_seconds',
  help: 'Time taken to generate official RCU verification reports in seconds',
  labelNames: ['format'], // 'pdf', 'docx'
  buckets: [0.25, 0.5, 1, 2.5, 5, 10, 20],
});
register.registerMetric(reportGenerationDurationSeconds);

export const securityEventsTotal = new client.Counter({
  name: 'lvms_security_events_total',
  help: 'Security events such as rate limits, brute-force attempts, and unauthorized access',
  labelNames: ['event_type'], // 'rate_limit', 'failed_login', 'blacklisted_ip'
});
register.registerMetric(securityEventsTotal);

export const redisOperationsTotal = new client.Counter({
  name: 'lvms_redis_operations_total',
  help: 'Total Redis cache operations and connections',
  labelNames: ['operation', 'status'], // 'hit', 'miss', 'set', 'error'
});
register.registerMetric(redisOperationsTotal);

// ─── 4. Request ID & Tracing Correlation Middleware ──────────────────────────
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = reqId;
  res.setHeader('x-request-id', reqId);
  next();
};

// ─── 5. Middleware to track incoming HTTP requests ───────────────────────────
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
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

    httpRequestDurationSeconds
      .labels(req.method, route, statusCode)
      .observe(durationInSeconds);

    httpRequestsTotal
      .labels(req.method, route, statusCode)
      .inc();

    if (res.statusCode >= 400) {
      const errorType =
        res.statusCode === 429
          ? 'RATE_LIMITED'
          : res.statusCode === 401 || res.statusCode === 403
          ? 'AUTH_FAILURE'
          : res.statusCode >= 500
          ? 'SERVER_ERROR'
          : 'CLIENT_ERROR';

      httpErrorsTotal
        .labels(req.method, route, statusCode, errorType)
        .inc();

      if (res.statusCode === 401 || res.statusCode === 403) {
        securityEventsTotal.labels('auth_failure').inc();
      } else if (res.statusCode === 429) {
        securityEventsTotal.labels('rate_limited').inc();
      }
    }
  });

  next();
};

// ─── 6. Handler for Frontend Page Analytics & Web Vitals Ingestion ───────────
export const recordPageViewHandler = (req: Request, res: Response) => {
  try {
    const { page, role = 'anonymous', durationMs, error, errorType, webVitals } = req.body || {};
    const normalizedPage = normalizePath(page || '/');

    if (error) {
      pageErrorsTotal
        .labels(normalizedPage, errorType || 'JAVASCRIPT_ERROR')
        .inc();
    } else {
      pageViewsTotal
        .labels(normalizedPage, role, 'success')
        .inc();

      if (typeof durationMs === 'number' && durationMs > 0) {
        pageRenderDurationSeconds
          .labels(normalizedPage)
          .observe(durationMs / 1000);
      }

      if (webVitals && typeof webVitals === 'object') {
        Object.entries(webVitals).forEach(([metricName, val]) => {
          if (typeof val === 'number') {
            pageWebVitals.labels(normalizedPage, metricName).observe(val);
          }
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(200).json({ success: false });
  }
};

// ─── 7. Handler for Prometheus Scraping Endpoint ─────────────────────────────
export const metricsHandler = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
};
