"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentDashboard = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const getAgentDashboard = async (req, res) => {
    try {
        const agentId = req.user?.id;
        const [agent, cases] = await Promise.all([
            db_1.default.user.findUnique({
                where: { id: agentId },
                select: { firstName: true, lastName: true, branch: true, email: true, phone: true },
            }),
            db_1.default.verificationCase.findMany({
                where: { agentId },
                include: { customer: true },
                orderBy: { updatedAt: 'desc' },
            }),
        ]);
        if (!agent)
            return res.status(404).json({ success: false, message: 'Agent not found' });
        let branchCity = 'Local Area';
        if (agent.branch) {
            const branchInfo = await db_1.default.branch.findFirst({
                where: { name: agent.branch },
            });
            if (branchInfo) {
                branchCity = branchInfo.city;
            }
        }
        const total = cases.length;
        const pending = cases.filter((c) => c.status === 'ASSIGNED' || c.status === 'PENDING').length;
        const inProgress = cases.filter((c) => c.status === 'IN_PROGRESS').length;
        const completed = cases.filter((c) => c.status === 'COMPLETED' || c.status === 'APPROVED').length;
        const rejected = cases.filter((c) => c.status === 'REJECTED').length;
        const reverification = cases.filter((item) => {
            try {
                const pd = typeof item.profileData === 'string' ? JSON.parse(item.profileData) : item.profileData;
                return pd?.adminReview?.decision === 'NEEDS_REVISION';
            }
            catch {
                return false;
            }
        }).length;
        const completedDurations = cases
            .filter((c) => (c.status === 'COMPLETED' || c.status === 'APPROVED') && c.completedAt)
            .map((c) => Math.max(1, Math.round((new Date(c.completedAt).getTime() - new Date(c.createdAt).getTime()) / 60000)));
        let avgTime = '—';
        if (completedDurations.length) {
            const avgMinutes = Math.round(completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length);
            if (avgMinutes >= 60) {
                const hours = Math.floor(avgMinutes / 60);
                const mins = avgMinutes % 60;
                avgTime = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
            }
            else {
                avgTime = `${avgMinutes}m`;
            }
        }
        const recentCases = cases.slice(0, 5).map((c) => ({
            id: c.id,
            customer: c.customer ? (0, helpers_1.parseFullName)(c.customer.firstName, c.customer.lastName) : 'Unknown Customer',
            phone: c.customer?.phone ?? '',
            address: c.customer?.address ?? 'No Address',
            type: c.type === 'RESIDENTIAL' ? 'Residential Verification' : 'Business Verification',
            status: c.status,
            priority: c.status === 'PENDING' ? 'High' : c.status === 'IN_PROGRESS' ? 'Medium' : 'Low',
            updatedOn: (0, helpers_1.formatDateTime)(c.updatedAt),
        }));
        // Today's schedule based on active/pending cases
        const todaySchedule = cases
            .filter((c) => c.status === 'PENDING' || c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS')
            .slice(0, 4)
            .map((c, index) => {
            const times = ['09:30 AM', '11:30 AM', '02:00 PM', '04:30 PM'];
            return {
                num: index + 1,
                id: c.id,
                name: c.customer ? (0, helpers_1.parseFullName)(c.customer.firstName, c.customer.lastName) : 'Unknown Customer',
                address: c.customer?.address ?? 'No Address',
                type: c.type === 'RESIDENTIAL' ? 'Residential Verification' : 'Business Verification',
                time: times[index] || 'Today',
                status: c.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending',
                bg: c.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700',
            };
        });
        return res.status(200).json({
            success: true,
            data: {
                agent: {
                    name: (0, helpers_1.parseFullName)(agent.firstName, agent.lastName),
                    branch: agent.branch ?? 'Unassigned',
                    branchCity,
                    email: agent.email,
                },
                kpis: { total, pending, inProgress, completed, rejected, reverification, avgTime },
                recentCases,
                todaySchedule,
            },
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load agent dashboard', 500, error);
    }
};
exports.getAgentDashboard = getAgentDashboard;
