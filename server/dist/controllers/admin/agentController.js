"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAgent = exports.toggleAgentStatus = exports.getAgents = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const getAgents = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const requester = await db_1.default.user.findUnique({ where: { id: adminId } });
        const isSuperAdmin = requester?.role === 'SUPER_ADMIN';
        const whereClause = { role: 'FIELD_AGENT' };
        if (!isSuperAdmin) {
            whereClause.OR = [
                { adminId },
                requester?.branch ? { branch: requester.branch } : {},
                { adminId: null },
            ].filter((obj) => Object.keys(obj).length > 0);
        }
        const agents = await db_1.default.user.findMany({
            where: whereClause,
            include: {
                assignedCases: {
                    select: { id: true, status: true, createdAt: true, completedAt: true, updatedAt: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const data = agents.map((agent) => {
            const assignedCases = agent.assignedCases || [];
            const completedCases = assignedCases.filter((item) => item.status === 'COMPLETED' || item.status === 'APPROVED').length;
            const activeCases = assignedCases.filter((item) => item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS' || item.status === 'PENDING').length;
            const rejectedCases = assignedCases.filter((item) => item.status === 'REJECTED').length;
            const totalCases = assignedCases.length;
            const successRate = totalCases === 0 ? 0 : Math.min(100, Math.round((completedCases / totalCases) * 100));
            const completedDurations = assignedCases
                .filter((item) => (item.status === 'COMPLETED' || item.status === 'APPROVED') && item.completedAt)
                .map((item) => Math.max(0.5, Math.round(((new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime()) / 86400000) * 10) / 10));
            const avgTurnaround = completedDurations.length
                ? `${(completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length).toFixed(1)} days`
                : '—';
            return {
                id: agent.id,
                name: (0, helpers_1.parseFullName)(agent.firstName, agent.lastName),
                firstName: agent.firstName,
                lastName: agent.lastName,
                email: agent.email,
                phone: agent.phone ?? '',
                branch: agent.branch ?? 'Unassigned',
                status: agent.isActive ? 'Active' : 'Inactive',
                activeCases,
                completedCases,
                rejectedCases,
                totalCases,
                successRate,
                avgTurnaround,
            };
        });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load agents', 500, error);
    }
};
exports.getAgents = getAgents;
const toggleAgentStatus = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
        const agentId = req.params.agentId;
        const whereClause = { id: agentId, role: 'FIELD_AGENT' };
        if (!isSuperAdmin) {
            whereClause.adminId = adminId;
        }
        const agent = await db_1.default.user.findFirst({ where: whereClause });
        if (!agent)
            return res.status(404).json({ success: false, message: 'Agent not found' });
        const updated = await db_1.default.user.update({
            where: { id: agentId },
            data: { isActive: !agent.isActive },
        });
        await (0, helpers_1.createAuditLog)({
            actor: `Admin (${adminId})`,
            action: updated.isActive ? 'Activated agent' : 'Deactivated agent',
            entity: `Agent ${(0, helpers_1.parseFullName)(agent.firstName, agent.lastName)} (${agent.email})`,
            ip: req.ip || 'system',
            adminId,
        });
        return res.status(200).json({
            success: true,
            message: `Agent ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
            data: updated,
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to toggle agent status', 500, error);
    }
};
exports.toggleAgentStatus = toggleAgentStatus;
const updateAgent = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
        const agentId = req.params.agentId;
        const { firstName, lastName, email, phone, branch, password } = req.body;
        const whereClause = { id: agentId, role: 'FIELD_AGENT' };
        if (!isSuperAdmin) {
            whereClause.adminId = adminId;
        }
        const agent = await db_1.default.user.findFirst({ where: whereClause });
        if (!agent)
            return res.status(404).json({ success: false, message: 'Agent not found' });
        const updateData = {
            firstName,
            lastName,
            email,
            phone: phone || null,
            branch: branch || null,
        };
        if (password && password.trim() !== '') {
            updateData.password = await bcryptjs_1.default.hash(password, 10);
        }
        const updated = await db_1.default.user.update({
            where: { id: agentId },
            data: updateData,
        });
        await (0, helpers_1.createAuditLog)({
            actor: `Admin (${adminId})`,
            action: 'Updated agent profile',
            entity: `Agent ${(0, helpers_1.parseFullName)(updated.firstName, updated.lastName)} (${updated.email})`,
            ip: req.ip || 'system',
            adminId,
        });
        return res.status(200).json({ success: true, message: 'Agent updated successfully', data: updated });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to update agent', 500, error);
    }
};
exports.updateAgent = updateAgent;
