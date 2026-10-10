import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Initialize Prometheus Default Metrics (Memory, CPU, Event Loop, GC)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Helper to normalize dynamic path parameters (UUIDs, IDs) to prevent label explosion
export function normalizePath(path: string): string {
  if (!path) return 'root';
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+/g, '/:id')
    .replace(/\?.*$/, '')
    .trim() || '/';
}

// ─── 1. HTTP API Request Metrics ─────────────────────────────────────────────
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds by method, route, and status code',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
register.registerMetric(httpRequestDurationSeconds);

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed by method, route, and status code',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP 4xx and 5xx errors by route and status code',
  labelNames: ['method', 'route', 'status_code', 'error_type'],
});
register.registerMetric(httpErrorsTotal);

// ─── 2. Frontend Page-Level Analytics Metrics ────────────────────────────────
const pageViewsTotal = new client.Counter({
  name: 'page_views_total',
  help: 'Total views per application page (most used vs least used pages)',
  labelNames: ['page', 'role', 'status'],
});
register.registerMetric(pageViewsTotal);

const pageRenderDurationSeconds = new client.Histogram({
  name: 'page_render_duration_seconds',
  help: 'Client-side render and load duration per page in seconds',
  labelNames: ['page'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
});
register.registerMetric(pageRenderDurationSeconds);

const pageErrorsTotal = new client.Counter({
  name: 'page_errors_total',
  help: 'Total client-side errors and failed page interactions by page and error type',
  labelNames: ['page', 'error_type'],
});
register.registerMetric(pageErrorsTotal);

const activeUsersGauge = new client.Gauge({
  name: 'active_sessions_count',
  help: 'Number of active active user sessions tracked in the last interval',
  labelNames: ['role'],
});
register.registerMetric(activeUsersGauge);

// ─── 3. Middleware to track incoming HTTP requests ───────────────────────────
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Do not track metrics or health ping endpoints to keep dashboard clean
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
      const errorType = res.statusCode >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
      httpErrorsTotal
        .labels(req.method, route, statusCode, errorType)
        .inc();
    }
  });

  next();
};

// ─── 4. Handler for Frontend Page Analytics Ingestion ────────────────────────
export const recordPageViewHandler = (req: Request, res: Response) => {
  try {
    const { page, role = 'anonymous', durationMs, error, errorType } = req.body || {};
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
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(200).json({ success: false }); // Always respond fast without failing client
  }
};

// ─── 5. Handler for Prometheus Scraping Endpoint ─────────────────────────────
export const metricsHandler = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
};
