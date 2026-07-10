import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken, requireRole } from '../middlewares/auth';

// ── Domain-Specific Agent Controllers ─────────────────────────────────────
import { getAgentDashboard } from '../controllers/agent/dashboardController';
import { getAgentCases, getAgentCaseById, updateAgentCaseStatus, submitVerification, uploadEvidence } from '../controllers/agent/caseController';
import { getAgentProfile } from '../controllers/agent/profileController';
import { getAgentNotifications } from '../controllers/agent/notificationController';
import { upload } from '../config/cloudinary';

const router = Router();

// Moderate rate limit for agent API (100 req / 15 min per IP)
const agentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});
router.use(agentLimiter);

// All agent routes require:
// 1. Valid HttpOnly JWT cookie
// 2. FIELD_AGENT role — admins CANNOT access agent routes
router.use(authenticateToken);
router.use(requireRole(['FIELD_AGENT']));

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard', getAgentDashboard);

// ── Cases ──────────────────────────────────────────────────────────────────
router.get('/cases', getAgentCases);
router.get('/cases/:id', getAgentCaseById);
router.patch('/cases/:id/status', updateAgentCaseStatus);
router.post('/cases/:id/submit', submitVerification);
router.post('/cases/:id/evidence', upload.single('file'), uploadEvidence);

// ── Profile ────────────────────────────────────────────────────────────────
router.get('/profile', getAgentProfile);

// ── Notifications ──────────────────────────────────────────────────────────
router.get('/notifications', getAgentNotifications);

export default router;
