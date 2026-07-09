import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cluster from 'cluster';
import os from 'os';
import routes from './routes';

// Load environment variables FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support larger photo payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Express Rate Limiter Middleware to mitigate sudden traffic DDoS spikes
const apiLimiter = rateLimit({
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
app.use('/api/v1', apiLimiter, routes);

// Global Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Multi-Core Scaling using Node Cluster Module (Triggers when CLUSTER_MODE=true or NODE_ENV=production)
const isClusterMode = process.env.CLUSTER_MODE === 'true' || process.env.NODE_ENV === 'production';

if (isClusterMode && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`\n🔥 [Traffic Scaling Master] Primary Master process ${process.pid} is running.`);
  console.log(`⚡ Launching ${numCPUs} multi-threaded Express workers to handle traffic spikes...\n`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`⚠️ Worker process ${worker.process.pid} died. Respawning worker...`);
    cluster.fork();
  });
} else {
  app.listen(PORT, () => {
    console.log(`🚀 Express server running on port ${PORT} (Worker PID: ${process.pid})`);
  });
}
