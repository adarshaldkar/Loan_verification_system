import { Router } from 'express';
import { z } from 'zod';
import { authLimiter, forgotPasswordLimiter } from '../middlewares/security';
import { registerAgent, loginUser, logoutUser, forgotPassword, verifyResetOtp, resetPassword } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

// Zod Schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  branch: z.string().optional(),
});

// Public Routes
router.post('/login', authLimiter, validate(loginSchema), loginUser);
router.post('/logout', logoutUser); // Added logout to clear cookies
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

// Protected Routes
router.post('/register', authenticateToken, requireRole(['ADMIN', 'MANAGER']), validate(registerSchema), registerAgent);

export default router;

