"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAgentProfile = exports.getAgentProfile = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const getAgentProfile = async (req, res) => {
    try {
        const agentId = req.user?.id;
        const agent = await db_1.default.user.findUnique({
            where: { id: agentId },
            include: { assignedCases: true },
        });
        if (!agent)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const completed = agent.assignedCases.filter((c) => c.status === 'COMPLETED' || c.status === 'APPROVED').length;
        const total = agent.assignedCases.length;
        const successRate = total === 0 ? 0 : Math.round((completed / total) * 100);
        return res.status(200).json({
            success: true,
            data: {
                id: agent.id,
                name: (0, helpers_1.parseFullName)(agent.firstName, agent.lastName),
                firstName: agent.firstName,
                lastName: agent.lastName,
                email: agent.email,
                phone: agent.phone ?? '',
                branch: agent.branch ?? 'Unassigned',
                joined: (0, helpers_1.formatDateTime)(agent.createdAt),
                stats: {
                    total,
                    completed,
                    pending: agent.assignedCases.filter((c) => c.status === 'ASSIGNED' || c.status === 'PENDING').length,
                    successRate,
                },
            },
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load profile', 500, error);
    }
};
exports.getAgentProfile = getAgentProfile;
const updateAgentProfile = async (req, res) => {
    try {
        const agentId = req.user?.id;
        if (!agentId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { firstName, lastName, phone } = req.body;
        if (!firstName || !lastName) {
            return res.status(400).json({ success: false, message: 'First name and last name are required' });
        }
        if (phone) {
            const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ success: false, message: 'Invalid phone format (must be 10 digits)' });
            }
        }
        const updatedUser = await db_1.default.user.update({
            where: { id: agentId },
            data: {
                firstName,
                lastName,
                phone: phone || null,
            },
        });
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: updatedUser.id,
                name: (0, helpers_1.parseFullName)(updatedUser.firstName, updatedUser.lastName),
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                phone: updatedUser.phone ?? '',
            }
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to update agent profile', 500, error);
    }
};
exports.updateAgentProfile = updateAgentProfile;
