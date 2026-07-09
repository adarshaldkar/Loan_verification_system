"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const admin_1 = __importDefault(require("./admin"));
const agent_1 = __importDefault(require("./agent"));
const router = (0, express_1.Router)();
// Health check endpoint (public)
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Loan Verification API is running securely!' });
});
// Mount routers
router.use('/auth', auth_1.default);
router.use('/admin', admin_1.default);
router.use('/agent', agent_1.default);
exports.default = router;
