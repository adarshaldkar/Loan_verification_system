"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const security_1 = require("../middlewares/security");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const router = (0, express_1.Router)();
// Zod Schemas
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    branch: zod_1.z.string().optional(),
});
// Public Routes
router.post('/login', security_1.authLimiter, (0, validate_1.validate)(loginSchema), authController_1.loginUser);
router.post('/logout', authController_1.logoutUser); // Added logout to clear cookies
router.post('/forgot-password', security_1.forgotPasswordLimiter, (0, validate_1.validate)(forgotPasswordSchema), authController_1.forgotPassword);
router.post('/verify-otp', authController_1.verifyResetOtp);
router.post('/reset-password', authController_1.resetPassword);
// Protected Routes
router.post('/register', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), (0, validate_1.validate)(registerSchema), authController_1.registerAgent);
exports.default = router;
