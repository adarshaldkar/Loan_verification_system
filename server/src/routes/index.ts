import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import adminRoutes from './admin';
import agentRoutes from './agent';
import geocodeRoutes from './geocode';

const router = Router();

// Health check endpoint (public)
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Loan Verification API is running securely!' });
});

// Mount routers
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/agent', agentRoutes); // ← Field Agent API (FIELD_AGENT role only)
router.use('/', geocodeRoutes);    // ← Shared geocoding (both roles, auth required)

export default router;

