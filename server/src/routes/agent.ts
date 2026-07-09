import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import {
  getAssignedCases,
  getCaseDetails,
  updateCaseStatus,
  submitVerification,
} from "../controllers/agentController";

const router = Router();

// Protect all agent routes with JWT token authentication
router.use(authenticateToken);

router.get("/cases", getAssignedCases);
router.get("/cases/:id", getCaseDetails);
router.put("/cases/:id/status", updateCaseStatus);
router.post("/cases/:id/verify", submitVerification);

export default router;
