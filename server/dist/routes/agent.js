"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const agentController_1 = require("../controllers/agentController");
const router = (0, express_1.Router)();
// Protect all agent routes with JWT token authentication
router.use(auth_1.authenticateToken);
router.get("/cases", agentController_1.getAssignedCases);
router.get("/cases/:id", agentController_1.getCaseDetails);
router.put("/cases/:id/status", agentController_1.updateCaseStatus);
router.post("/cases/:id/verify", agentController_1.submitVerification);
exports.default = router;
