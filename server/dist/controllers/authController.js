"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerAgent = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_loan_verify_2026';
const registerAgent = async (req, res) => {
    try {
        const { email, password, firstName, lastName, branch } = req.body;
        // Check if user exists
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Create user (Field Agent by default)
        const user = await db_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                branch,
                role: 'FIELD_AGENT'
            }
        });
        res.status(201).json({ success: true, message: 'Agent registered successfully', userId: user.id });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
exports.registerAgent = registerAgent;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check user
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        // Check password
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, branch: user.branch }, JWT_SECRET, {
            expiresIn: '7d'
        });
        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                branch: user.branch
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
exports.loginUser = loginUser;
