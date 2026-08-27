"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
// ── New Domain-Specific Controllers ────────────────────────────────────────
const dashboardController_1 = require("../controllers/admin/dashboardController");
const customerController_1 = require("../controllers/admin/customerController");
const agentController_1 = require("../controllers/admin/agentController");
const caseController_1 = require("../controllers/admin/caseController");
const verificationController_1 = require("../controllers/admin/verificationController");
const branchController_1 = require("../controllers/admin/branchController");
const reportController_1 = require("../controllers/admin/reportController");
const auditLogController_1 = require("../controllers/admin/auditLogController");
const settingsController_1 = require("../controllers/admin/settingsController");
const profileController_1 = require("../controllers/admin/profileController");
const uploadController_1 = require("../controllers/admin/uploadController");
const authController_1 = require("../controllers/authController");
const manageAdminsController_1 = require("../controllers/admin/manageAdminsController");
const zod_1 = require("zod");
const validate_1 = require("../middlewares/validate");
const registerAdminSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    phone: zod_1.z.string().regex(/^(?:\+91|0)?[6-9]\d{9}$/, 'Invalid phone format (e.g. +91XXXXXXXXXX or standard 10 digits)').optional().or(zod_1.z.literal('')),
    branch: zod_1.z.string().min(2, 'Branch must be at least 2 characters'),
});
const updateAdminSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters').optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().regex(/^(?:\+91|0)?[6-9]\d{9}$/, 'Invalid phone format (e.g. +91XXXXXXXXXX or standard 10 digits)').optional().or(zod_1.z.literal('')),
    branch: zod_1.z.string().min(2, 'Branch must be at least 2 characters'),
    isActive: zod_1.z.boolean().optional(),
});
const router = (0, express_1.Router)();
// All admin routes require a valid JWT + ADMIN or MANAGER role
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['ADMIN', 'MANAGER']));
// ── Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard', dashboardController_1.getDashboard);
router.get('/analytics', dashboardController_1.getAnalytics);
// ── Agents ─────────────────────────────────────────────────────────────────
router.post('/agents/register', authController_1.registerAgent);
router.get('/agents', agentController_1.getAgents);
router.put('/agents/:agentId', agentController_1.updateAgent);
router.patch('/agents/:agentId/toggle', agentController_1.toggleAgentStatus);
// ── Customers ──────────────────────────────────────────────────────────────
router.get('/customers', customerController_1.getCustomers);
router.post('/customers', customerController_1.createCustomerAndCase);
// ── Cases ──────────────────────────────────────────────────────────────────
router.get('/cases', caseController_1.getCases);
router.get('/cases/:caseId', caseController_1.getCaseById);
router.put('/cases/bulk-assign', caseController_1.assignBulkCases);
router.put('/cases/batch-assign', caseController_1.batchAssignCases);
router.put('/cases/:caseId/assign', caseController_1.assignCase);
router.put('/cases/:caseId/status', caseController_1.updateCaseStatus);
// ── Verification Review ────────────────────────────────────────────────────
router.get('/verification', verificationController_1.getCompletedCases);
router.get('/verification/:caseId', verificationController_1.getVerificationDetail);
router.post('/verification/:caseId/review', verificationController_1.reviewCase);
// ── Branches ───────────────────────────────────────────────────────────────
router.get('/branches', branchController_1.getBranches);
router.post('/branches', branchController_1.createBranch);
// ── Reports ────────────────────────────────────────────────────────────────
router.get('/reports', reportController_1.getReports);
router.get('/reports/metrics', reportController_1.getReportMetrics);
router.post('/reports/generate', reportController_1.generateReport);
// ── Audit Logs ─────────────────────────────────────────────────────────────
router.get('/audit-logs', auditLogController_1.getAuditLogs);
// ── Profile & Settings ─────────────────────────────────────────────────────
router.get('/profile', profileController_1.getProfile);
router.put('/profile', profileController_1.updateProfile);
router.put('/profile/password', profileController_1.updatePassword);
router.get('/settings', settingsController_1.getSettings);
router.put('/settings', settingsController_1.updateSettings);
// ── Bulk Upload ────────────────────────────────────────────────────────────
router.post('/upload/bulk', uploadController_1.bulkUploadCases);
router.get('/upload/batch/:batchId', uploadController_1.getBatchStatus);
// ── Admins ──────────────────────────────────────────────────────────────────
router.get('/admins', manageAdminsController_1.getAdmins);
router.post('/admins/register', (0, validate_1.validate)(registerAdminSchema), manageAdminsController_1.registerAdmin);
router.put('/admins/:adminId', (0, validate_1.validate)(updateAdminSchema), manageAdminsController_1.updateAdmin);
// ── Tracking ───────────────────────────────────────────────────────────────
const trackingController_1 = require("../controllers/admin/trackingController");
router.get('/tracking/active', trackingController_1.getActiveRides);
router.get('/tracking/history/:rideId', trackingController_1.getRideHistory);
exports.default = router;
