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
        const agents = await db_1.default.user.findMany({
            where: { role: 'FIELD_AGENT', adminId },
            include: { assignedCases: true },
            orderBy: { createdAt: 'asc' },
        });
        const data = agents.map((agent) => {
            const assignedCases = agent.assignedCases;
            const completedCases = assignedCases.filter((item) => item.status === 'COMPLETED' || item.status === 'APPROVED').length;
            const activeCases = assignedCases.filter((item) => item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS').length;
            const rejectedCases = assignedCases.filter((item) => item.status === 'REJECTED').length;
            const totalResolved = completedCases + rejectedCases;
            const successRate = totalResolved === 0 ? 0 : Math.round((completedCases / totalResolved) * 100);
            const completedDurations = assignedCases
                .filter((item) => (item.status === 'COMPLETED' || item.status === 'APPROVED') && item.completedAt)
                .map((item) => Math.max(1, Math.round((new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime()) / 86400000)));
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
        const agentId = req.params.agentId;
        const agent = await db_1.default.user.findFirst({ where: { id: agentId, adminId } });
        if (!agent)
            return res.status(404).json({ success: false, message: 'Agent not found' });
        const updated = await db_1.default.user.update({
            where: { id: agentId },
            data: { isActive: !agent.isActive },
        });
        return res.status(200).json({ success: true, message: `Agent ${updated.isActive ? 'activated' : 'deactivated'}`, data: updated });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to toggle agent status', 500, error);
    }
};
exports.toggleAgentStatus = toggleAgentStatus;
const updateAgent = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const agentId = req.params.agentId;
        const { firstName, lastName, email, phone, branch, password } = req.body;
        const agent = await db_1.default.user.findFirst({ where: { id: agentId, adminId } });
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
        return res.status(200).json({ success: true, message: 'Agent updated successfully', data: updated });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to update agent', 500, error);
    }
};
exports.updateAgent = updateAgent;
