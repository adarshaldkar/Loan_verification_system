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
            take: 30,
        });
        const notifications = cases.map((c) => {
            let type = 'INFO';
            let title = '';
            let priority = 'Low';
            const customerName = c.customer ? (0, helpers_1.parseFullName)(c.customer.firstName, c.customer.lastName) : 'Unknown Customer';
            let pd = null;
            try {
                pd = typeof c.profileData === 'string' ? JSON.parse(c.profileData) : c.profileData;
            }
            catch { }
            const isRevision = pd?.adminReview?.decision === 'NEEDS_REVISION';
            if (isRevision) {
                type = 'RE_VERIFICATION';
                title = `Action Required: Re-verification for ${customerName}`;
                priority = 'High';
            }
            else if (c.status === 'APPROVED' || c.status === 'COMPLETED') {
                type = 'APPROVED';
                title = `Case Verified & Approved: ${customerName}`;
            }
            else if (c.status === 'REJECTED') {
                type = 'REJECTED';
                title = `Verification Declined: ${customerName}`;
                priority = 'High';
            }
            else if (c.status === 'ASSIGNED' || c.status === 'PENDING') {
                type = 'ASSIGNMENT';
                title = `New Verification Assigned: ${customerName}`;
                priority = 'High';
            }
            else {
                type = 'INFO';
                title = `Status Updated: ${customerName} (${(0, helpers_1.resolveCaseStatus)(c.status)})`;
            }
            return {
                id: c.id,
                type,
                priority,
                title,
                body: c.customer?.address || 'No address provided',
                customerName,
                phone: c.customer?.phone || '',
                loanType: c.customer?.loanType || 'Loan Verification',
                caseId: c.id,
                applicationId: c.customer?.applicationId || `APP-${c.id.slice(0, 8).toUpperCase()}`,
                status: c.status,
                time: (0, helpers_1.formatDateTime)(c.updatedAt),
                read: c.status === 'COMPLETED' || c.status === 'APPROVED',
            };
        });
        return res.status(200).json({ success: true, data: notifications });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load notifications', 500, error);
    }
};
exports.getAgentNotifications = getAgentNotifications;
