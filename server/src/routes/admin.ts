import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth';
import {
  // Dashboard
  getDashboard,
  // Analytics
  getAnalytics,
  // Agents
  getAgents,
  toggleAgentStatus,
  // Customers & Cases
  getCustomers,
  createCustomerAndCase,
  getCases,
  assignCase,
  updateCaseStatus,
  // Branches
  getBranches,
  createBranch,
  // Reports
  getReports,
  generateReport,
  // Audit
  getAuditLogs,
  // Profile & Settings
  getProfile,
  getSettings,
  updateSettings,
} from '../controllers/adminController';
import { registerAgent } from '../controllers/authController';

const router = Router();

// All admin routes require a valid JWT
router.use(authenticateToken);
// All admin routes require ADMIN or MANAGER role
router.use(requireRole(['ADMIN', 'MANAGER']));

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);

// ── Agents ─────────────────────────────────────────────────────────────────
router.post('/agents/register', registerAgent);
router.get('/agents', getAgents);
router.patch('/agents/:agentId/toggle', toggleAgentStatus);

// ── Customers ──────────────────────────────────────────────────────────────
router.get('/customers', getCustomers);
router.post('/customers', createCustomerAndCase);

// ── Cases ──────────────────────────────────────────────────────────────────
router.get('/cases', getCases);
router.put('/cases/:caseId/assign', assignCase);
router.put('/cases/:caseId/status', updateCaseStatus);

// ── Branches ───────────────────────────────────────────────────────────────
router.get('/branches', getBranches);
router.post('/branches', createBranch);

// ── Reports ────────────────────────────────────────────────────────────────
router.get('/reports', getReports);
router.post('/reports/generate', generateReport);

// ── Audit Logs ─────────────────────────────────────────────────────────────
router.get('/audit-logs', getAuditLogs);

// ── Profile & Settings ─────────────────────────────────────────────────────
router.get('/profile', getProfile);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
