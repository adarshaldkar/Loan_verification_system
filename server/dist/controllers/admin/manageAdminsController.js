"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdmin = exports.getAdmins = exports.registerAdmin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const registerAdmin = async (req, res) => {
    try {
        const requesterId = req.user?.id;
        const requester = await db_1.default.user.findUnique({ where: { id: requesterId } });
        if (!requester || (requester.email !== 'akshaya@gmail.com' && requester.email !== 'adarshaldkar@gmail.com')) {
            return res.status(403).json({ success: false, message: 'Forbidden. Only Super Admins can register new Admins.' });
        }
        const { email, password, firstName, lastName, phone, branch } = req.body;
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const user = await db_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                branch,
                role: 'ADMIN'
            }
        });
        res.status(201).json({ success: true, message: 'Admin registered successfully', userId: user.id });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to register admin', 500, error);
    }
};
exports.registerAdmin = registerAdmin;
const getAdmins = async (req, res) => {
    try {
        const admins = await db_1.default.user.findMany({
            where: { role: 'ADMIN' },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                branch: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        const formattedAdmins = admins.map(a => ({
            id: a.id,
            name: `${a.firstName} ${a.lastName}`,
            email: a.email,
            phone: a.phone || '',
            branch: a.branch || 'System',
            status: a.isActive ? 'Active' : 'Inactive',
        }));
        res.status(200).json({ success: true, data: formattedAdmins });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load admins', 500, error);
    }
};
exports.getAdmins = getAdmins;
const updateAdmin = async (req, res) => {
    try {
        const requesterId = req.user?.id;
        const requester = await db_1.default.user.findUnique({ where: { id: requesterId } });
        if (!requester || (requester.email !== 'akshaya@gmail.com' && requester.email !== 'adarshaldkar@gmail.com')) {
            return res.status(403).json({ success: false, message: 'Forbidden. Only Super Admins can edit Admins.' });
        }
        const adminId = req.params.adminId;
        const { email, password, firstName, lastName, phone, branch, isActive } = req.body;
        const existingAdmin = await db_1.default.user.findUnique({ where: { id: adminId } });
        if (!existingAdmin || existingAdmin.role !== 'ADMIN') {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        let hashedPassword = undefined;
        if (password && password.trim() !== '') {
            const salt = await bcryptjs_1.default.genSalt(10);
            hashedPassword = await bcryptjs_1.default.hash(password, salt);
        }
        const updated = await db_1.default.user.update({
            where: { id: adminId },
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                branch,
                isActive: isActive !== undefined ? isActive : undefined,
            },
        });
        res.status(200).json({ success: true, message: 'Admin updated successfully', user: updated });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to update admin', 500, error);
    }
};
exports.updateAdmin = updateAdmin;
