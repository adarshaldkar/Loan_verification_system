import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import adminRoutes from './admin';
import agentRoutes from './agent';

const router = Router();

// Health check endpoint (public)
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Loan Verification API is running securely!' });
});

// Mount routers
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/agent', agentRoutes);

export default router;
