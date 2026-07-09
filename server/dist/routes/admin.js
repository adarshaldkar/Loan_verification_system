"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const adminController_1 = require("../controllers/adminController");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// All admin routes require a valid JWT
router.use(auth_1.authenticateToken);
// All admin routes require ADMIN or MANAGER role
router.use((0, auth_1.requireRole)(['ADMIN', 'MANAGER']));
// ── Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard', adminController_1.getDashboard);
router.get('/analytics', adminController_1.getAnalytics);
// ── Agents ─────────────────────────────────────────────────────────────────
router.post('/agents/register', authController_1.registerAgent);
router.get('/agents', adminController_1.getAgents);
router.patch('/agents/:agentId/toggle', adminController_1.toggleAgentStatus);
// ── Customers ──────────────────────────────────────────────────────────────
router.get('/customers', adminController_1.getCustomers);
router.post('/customers', adminController_1.createCustomerAndCase);
// ── Cases ──────────────────────────────────────────────────────────────────
router.get('/cases', adminController_1.getCases);
router.put('/cases/:caseId/assign', adminController_1.assignCase);
router.put('/cases/:caseId/status', adminController_1.updateCaseStatus);
// ── Branches ───────────────────────────────────────────────────────────────
router.get('/branches', adminController_1.getBranches);
router.post('/branches', adminController_1.createBranch);
// ── Reports ────────────────────────────────────────────────────────────────
router.get('/reports', adminController_1.getReports);
router.post('/reports/generate', adminController_1.generateReport);
// ── Audit Logs ─────────────────────────────────────────────────────────────
router.get('/audit-logs', adminController_1.getAuditLogs);
// ── Profile & Settings ─────────────────────────────────────────────────────
router.get('/profile', adminController_1.getProfile);
router.get('/settings', adminController_1.getSettings);
router.put('/settings', adminController_1.updateSettings);
// ── Bulk Upload ────────────────────────────────────────────────────────────
router.post('/upload/bulk', adminController_1.bulkUploadCases);
exports.default = router;
