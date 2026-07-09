"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Public Routes
router.post('/login', authController_1.loginUser);
// Protected Routes (Only Admins/Managers can register new Field Agents)
router.post('/register', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), authController_1.registerAgent);
exports.default = router;
