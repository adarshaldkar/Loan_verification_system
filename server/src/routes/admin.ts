import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { 
  getAgents, 
  createCustomerAndCase, 
  getCases, 
  assignCase, 
  updateCaseStatus, 
  getAnalytics 
} from '../controllers/adminController';
import { registerAgent } from '../controllers/authController';

const router = Router();

// Apply auth middleware to all admin routes
router.use(authenticateToken);
// Apply RBAC: Only ADMIN and MANAGER can access these routes
router.use(requireRole(['ADMIN', 'MANAGER']));

// 1. Agent Management
router.post('/agents/register', registerAgent); // Registers a new field agent
router.get('/agents', getAgents); // Lists all agents

// 2. Customer & Case Management
router.post('/cases', createCustomerAndCase); // Create customer + pending case
router.get('/cases', getCases); // List all cases (can filter by ?status=PENDING)
router.put('/cases/:caseId/assign', assignCase); // Assign a case to an agent

// 3. Verification Review
router.put('/cases/:caseId/status', updateCaseStatus); // Approve (COMPLETED) or REJECT

// 4. Dashboard Analytics
router.get('/analytics', getAnalytics); // Get summary statistics

export default router;
