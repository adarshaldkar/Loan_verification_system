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
        if (!requester || requester.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Forbidden. Only Super Admins can register new Admins.' });
        }
        const { email, password, firstName, lastName, phone, branch, role = 'ADMIN' } = req.body;
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const user = await db_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone: phone || null,
                branch: branch || 'System',
                role: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
            },
        });
        await (0, helpers_1.createAuditLog)({
            actor: `Super Admin (${requester.email})`,
            action: 'Registered new administrator',
            entity: `Admin ${(0, helpers_1.parseFullName)(firstName, lastName)} (${email})`,
            ip: req.ip || 'system',
            adminId: requesterId,
        });
        res.status(201).json({ success: true, message: 'Admin registered successfully', data: user });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to register admin', 500, error);
    }
};
exports.registerAdmin = registerAdmin;
const getAdmins = async (req, res) => {
    try {
        const [admins, cases, agents] = await Promise.all([
            db_1.default.user.findMany({
                where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    branch: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            db_1.default.verificationCase.findMany({
                select: { adminId: true, customer: { select: { adminId: true } } },
            }),
            db_1.default.user.findMany({
                where: { role: 'FIELD_AGENT' },
                select: { adminId: true, branch: true },
            }),
        ]);
        const formattedAdmins = admins.map((a) => {
            const adminCases = cases.filter((c) => c.adminId === a.id || c.customer?.adminId === a.id).length;
            const adminAgents = agents.filter((ag) => ag.adminId === a.id || (a.branch && ag.branch === a.branch)).length;
            return {
                id: a.id,
                name: (0, helpers_1.parseFullName)(a.firstName, a.lastName),
                firstName: a.firstName,
                lastName: a.lastName,
                email: a.email,
                phone: a.phone || '',
                branch: a.branch || 'System',
                role: a.role,
                status: a.isActive ? 'Active' : 'Inactive',
                totalCases: adminCases,
                totalAgents: adminAgents,
                createdAt: a.createdAt,
            };
        });
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
        if (!requester || requester.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Forbidden. Only Super Admins can edit Admins.' });
        }
        const adminId = req.params.adminId;
        const { email, password, firstName, lastName, phone, branch, isActive, role } = req.body;
        const existingAdmin = await db_1.default.user.findUnique({ where: { id: adminId } });
        if (!existingAdmin || !['ADMIN', 'SUPER_ADMIN'].includes(existingAdmin.role)) {
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
                email: email || undefined,
                password: hashedPassword,
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                phone: phone || null,
                branch: branch || undefined,
                role: role || undefined,
                isActive: isActive !== undefined ? isActive : undefined,
            },
        });
        await (0, helpers_1.createAuditLog)({
            actor: `Super Admin (${requester.email})`,
            action: 'Updated administrator profile',
            entity: `Admin ${(0, helpers_1.parseFullName)(updated.firstName, updated.lastName)} (${updated.email})`,
            ip: req.ip || 'system',
            adminId: requesterId,
        });
        res.status(200).json({ success: true, message: 'Admin updated successfully', user: updated });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to update admin', 500, error);
    }
};
exports.updateAdmin = updateAdmin;
