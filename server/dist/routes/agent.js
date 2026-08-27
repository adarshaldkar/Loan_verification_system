"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("../middlewares/auth");
// ── Domain-Specific Agent Controllers ─────────────────────────────────────
const dashboardController_1 = require("../controllers/agent/dashboardController");
const caseController_1 = require("../controllers/agent/caseController");
const profileController_1 = require("../controllers/agent/profileController");
const profileController_2 = require("../controllers/admin/profileController");
const notificationController_1 = require("../controllers/agent/notificationController");
const cloudinary_1 = require("../config/cloudinary");
const router = (0, express_1.Router)();
// Moderate rate limit for agent API (100 req / 15 min per IP)
const agentLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests. Please slow down.' },
});
router.use(agentLimiter);
// All agent routes require:
// 1. Valid HttpOnly JWT cookie
// 2. FIELD_AGENT role — admins CANNOT access agent routes
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['FIELD_AGENT']));
// ── Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard', dashboardController_1.getAgentDashboard);
// ── Cases ──────────────────────────────────────────────────────────────────
router.get('/cases', caseController_1.getAgentCases);
router.get('/cases/:id', caseController_1.getAgentCaseById);
router.patch('/cases/:id/status', caseController_1.updateAgentCaseStatus);
router.post('/cases/:id/submit', caseController_1.submitVerification);
router.post('/cases/:id/evidence', cloudinary_1.upload.single('file'), caseController_1.uploadEvidence);
// ── Profile ────────────────────────────────────────────────────────────────
router.get('/profile', profileController_1.getAgentProfile);
router.put('/profile', profileController_1.updateAgentProfile);
router.put('/profile/password', profileController_2.updatePassword);
// ── Notifications ──────────────────────────────────────────────────────────
router.get('/notifications', notificationController_1.getAgentNotifications);
const security_1 = require("../middlewares/security");
// ── Rides & Tracking ───────────────────────────────────────────────────────
const rideController_1 = require("../controllers/agent/rideController");
router.post('/rides/start', rideController_1.startRide);
router.post('/rides/ping', security_1.pingLimiter, rideController_1.logLocationPing);
router.post('/rides/end', rideController_1.endRide);
exports.default = router;
