import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth';

// ── New Domain-Specific Controllers ────────────────────────────────────────
import { getDashboard, getAnalytics } from '../controllers/admin/dashboardController';
import { getCustomers, createCustomerAndCase } from '../controllers/admin/customerController';
import { getAgents, toggleAgentStatus, updateAgent } from '../controllers/admin/agentController';
import { getCases, assignCase, updateCaseStatus, getCaseById } from '../controllers/admin/caseController';
import { getBranches, createBranch } from '../controllers/admin/branchController';
import { getReports, generateReport } from '../controllers/admin/reportController';
import { getAuditLogs } from '../controllers/admin/auditLogController';
import { getSettings, updateSettings } from '../controllers/admin/settingsController';
import { getProfile } from '../controllers/admin/profileController';
import { bulkUploadCases } from '../controllers/admin/uploadController';
import { registerAgent } from '../controllers/authController';
import { registerAdmin, getAdmins } from '../controllers/admin/manageAdminsController';

const router = Router();

// All admin routes require a valid JWT + ADMIN or MANAGER role
router.use(authenticateToken);
router.use(requireRole(['ADMIN', 'MANAGER']));

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);

// ── Agents ─────────────────────────────────────────────────────────────────
router.post('/agents/register', registerAgent);
router.get('/agents', getAgents);
router.put('/agents/:agentId', updateAgent);
router.patch('/agents/:agentId/toggle', toggleAgentStatus);

// ── Customers ──────────────────────────────────────────────────────────────
router.get('/customers', getCustomers);
router.post('/customers', createCustomerAndCase);

// ── Cases ──────────────────────────────────────────────────────────────────
router.get('/cases', getCases);
router.get('/cases/:caseId', getCaseById);
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

// ── Bulk Upload ────────────────────────────────────────────────────────────
router.post('/upload/bulk', bulkUploadCases);

// ── Admins ──────────────────────────────────────────────────────────────────
router.get('/admins', getAdmins);
router.post('/admins/register', registerAdmin);

// ── Tracking ───────────────────────────────────────────────────────────────
import { getActiveRides, getRideHistory } from '../controllers/admin/trackingController';
router.get('/tracking/active', getActiveRides);
router.get('/tracking/history/:rideId', getRideHistory);

export default router;
