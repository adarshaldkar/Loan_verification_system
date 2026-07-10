import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { registerAgent, loginUser, logoutUser } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

// Strict Rate Limiter for Login (max 5 requests per 15 mins)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

// Zod Schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  branch: z.string().optional(),
});

// Public Routes
router.post('/login', loginLimiter, validate(loginSchema), loginUser);
router.post('/logout', logoutUser); // Added logout to clear cookies

// Protected Routes
router.post('/register', authenticateToken, requireRole(['ADMIN', 'MANAGER']), validate(registerSchema), registerAgent);

export default router;

