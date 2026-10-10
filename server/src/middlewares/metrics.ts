import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Initialize Prometheus Default Metrics (Memory, CPU, Event Loop, GC)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// HTTP Request Duration Histogram
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
register.registerMetric(httpRequestDurationMicroseconds);

// HTTP Requests Counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

// Middleware to track incoming HTTP requests
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
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

// Handler for the /metrics scraping endpoint
export const metricsHandler = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
};
