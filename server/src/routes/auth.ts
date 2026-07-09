import { Router } from 'express';
import { registerAgent, loginUser } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middlewares/auth';

const router = Router();

// Public Routes
router.post('/login', loginUser);

// Protected Routes (Only Admins/Managers can register new Field Agents)
router.post('/register', authenticateToken, requireRole(['ADMIN', 'MANAGER']), registerAgent);

export default router;
