"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentNotifications = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const getAgentNotifications = async (req, res) => {
    try {
        const agentId = req.user?.id;
        const cases = await db_1.default.verificationCase.findMany({
            where: { agentId },
            include: { customer: true },
            orderBy: { updatedAt: 'desc' },
            take: 20,
        });
        const notifications = cases.map((c) => ({
            id: c.id,
            type: c.status === 'ASSIGNED' ? 'new_case' : 'status_update',
            title: c.status === 'ASSIGNED'
                ? `New case assigned: ${(0, helpers_1.parseFullName)(c.customer.firstName, c.customer.lastName)}`
                : `Case updated to ${(0, helpers_1.resolveCaseStatus)(c.status)}`,
            body: c.customer.address,
            caseId: c.id,
            time: (0, helpers_1.formatDateTime)(c.updatedAt),
            read: c.status !== 'ASSIGNED',
        }));
        return res.status(200).json({ success: true, data: notifications });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load notifications', 500, error);
    }
};
exports.getAgentNotifications = getAgentNotifications;
