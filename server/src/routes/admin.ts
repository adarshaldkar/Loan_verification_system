import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth';

// ── New Domain-Specific Controllers ────────────────────────────────────────
import { getDashboard, getAnalytics } from '../controllers/admin/dashboardController';
import { getCustomers, createCustomerAndCase } from '../controllers/admin/customerController';
import { getAgents, toggleAgentStatus, updateAgent } from '../controllers/admin/agentController';
import { getCases, assignCase, assignBulkCases, batchAssignCases, updateCaseStatus, getCaseById } from '../controllers/admin/caseController';
import { getCompletedCases, getVerificationDetail, reviewCase } from '../controllers/admin/verificationController';
import { getBranches, createBranch } from '../controllers/admin/branchController';
import { getReports, generateReport, getReportMetrics } from '../controllers/admin/reportController';
import { getAuditLogs } from '../controllers/admin/auditLogController';
import { getSettings, updateSettings } from '../controllers/admin/settingsController';
import { getProfile, updateProfile, updatePassword } from '../controllers/admin/profileController';
import { bulkUploadCases, getBatchStatus } from '../controllers/admin/uploadController';
import { registerAgent } from '../controllers/authController';
import { registerAdmin, getAdmins, updateAdmin } from '../controllers/admin/manageAdminsController';
import { z } from 'zod';
import { validate } from '../middlewares/validate';

const registerAdminSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(/^(?:\+91|0)?[6-9]\d{9}$/, 'Invalid phone format (e.g. +91XXXXXXXXXX or standard 10 digits)').optional().or(z.literal('')),
  branch: z.string().min(2, 'Branch must be at least 2 characters'),
});

const updateAdminSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  phone: z.string().regex(/^(?:\+91|0)?[6-9]\d{9}$/, 'Invalid phone format (e.g. +91XXXXXXXXXX or standard 10 digits)').optional().or(z.literal('')),
  branch: z.string().min(2, 'Branch must be at least 2 characters'),
  isActive: z.boolean().optional(),
});

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
router.put('/cases/bulk-assign', assignBulkCases);
router.put('/cases/batch-assign', batchAssignCases);
router.put('/cases/:caseId/assign', assignCase);
router.put('/cases/:caseId/status', updateCaseStatus);

// ── Verification Review ────────────────────────────────────────────────────
router.get('/verification', getCompletedCases);
router.get('/verification/:caseId', getVerificationDetail);
router.post('/verification/:caseId/review', reviewCase);

// ── Branches ───────────────────────────────────────────────────────────────
router.get('/branches', getBranches);
router.post('/branches', createBranch);

// ── Reports ────────────────────────────────────────────────────────────────
router.get('/reports', getReports);
router.get('/reports/metrics', getReportMetrics);
router.post('/reports/generate', generateReport);

// ── Audit Logs ─────────────────────────────────────────────────────────────
router.get('/audit-logs', getAuditLogs);

// ── Profile & Settings ─────────────────────────────────────────────────────
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/password', updatePassword);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// ── Bulk Upload ────────────────────────────────────────────────────────────
router.post('/upload/bulk', bulkUploadCases);
router.get('/upload/batch/:batchId', getBatchStatus);

// ── Admins ──────────────────────────────────────────────────────────────────
router.get('/admins', getAdmins);
router.post('/admins/register', validate(registerAdminSchema), registerAdmin);
router.put('/admins/:adminId', validate(updateAdminSchema), updateAdmin);

// ── Tracking ───────────────────────────────────────────────────────────────
import { getActiveRides, getRideHistory } from '../controllers/admin/trackingController';
router.get('/tracking/active', getActiveRides);
router.get('/tracking/history/:rideId', getRideHistory);

export default router;
