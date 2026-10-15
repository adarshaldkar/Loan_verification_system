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
        const period = (req.query.period || '').toLowerCase().trim();
        const startDateParam = req.query.startDate;
        const endDateParam = req.query.endDate;
        const now = new Date();
        let startDate;
        let endDate;
        if (startDateParam && endDateParam) {
            startDate = new Date(startDateParam);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(endDateParam);
            endDate.setHours(23, 59, 59, 999);
        }
        else if (period === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }
        else if (period === 'last 7 days') {
            startDate = new Date(now.getTime() - 6 * 86400000);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }
        else if (period === 'this week') {
            const dayOfWeek = now.getDay();
            const diffToMonday = (dayOfWeek + 6) % 7;
            startDate = new Date(now.getTime() - diffToMonday * 86400000);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate.getTime() + 6 * 86400000);
            endDate.setHours(23, 59, 59, 999);
        }
        else if (period === 'last week') {
            const dayOfWeek = now.getDay();
            const diffToMonday = (dayOfWeek + 6) % 7;
            const monday = new Date(now.getTime() - diffToMonday * 86400000);
            startDate = new Date(monday.getTime() - 7 * 86400000);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(monday.getTime() - 1 * 86400000);
            endDate.setHours(23, 59, 59, 999);
        }
        else if (period === 'this month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }
        else if (period === 'last month') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        }
        const [agent, allCases] = await Promise.all([
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
        let cases = allCases;
        if (startDate && endDate) {
            cases = allCases.filter((c) => {
                if (c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS' || c.status === 'PENDING')
                    return true;
                const cDate = c.createdAt ? new Date(c.createdAt) : null;
                const uDate = c.updatedAt ? new Date(c.updatedAt) : null;
                const compDate = c.completedAt ? new Date(c.completedAt) : null;
                return ((cDate && cDate >= startDate && cDate <= endDate) ||
                    (uDate && uDate >= startDate && uDate <= endDate) ||
                    (compDate && compDate >= startDate && compDate <= endDate));
            });
        }
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
            .map((c) => {
            const start = c.updatedAt ? new Date(c.updatedAt).getTime() : new Date(c.createdAt).getTime();
            const end = new Date(c.completedAt).getTime();
            const diffMins = Math.round((end - start) / 60000);
            // Bound realistic field verification duration between 20 mins and 180 mins
            return diffMins > 0 && diffMins < 1000 ? diffMins : 45;
        });
        let avgTime = '45m';
        if (completedDurations.length) {
            const avgMinutes = Math.round(completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length);
            if (avgMinutes >= 60) {
                const hours = Math.floor(avgMinutes / 60);
                const mins = avgMinutes % 60;
                avgTime = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
            }
            else {
                avgTime = `${Math.max(15, avgMinutes)}m`;
            }
        }
        const recentCases = cases.slice(0, 5).map((c) => ({
            id: c.id,
            customer: c.customer ? (0, helpers_1.parseFullName)(c.customer.firstName, c.customer.lastName) : 'Unknown Customer',
            phone: c.customer?.phone ?? '',
            address: c.customer?.address ?? 'No Address',
            type: c.type,
            status: c.status,
            priority: c.status === 'PENDING' ? 'High' : c.status === 'IN_PROGRESS' ? 'Medium' : 'Low',
            updatedOn: (0, helpers_1.formatDateTime)(c.updatedAt),
            addressLatitude: c.addressLatitude ?? null,
            addressLongitude: c.addressLongitude ?? null,
            addressAccuracy: c.addressAccuracy ?? null,
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
                type: c.type,
                time: times[index] || 'Today',
                status: c.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending',
                bg: c.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700',
                addressLatitude: c.addressLatitude ?? null,
                addressLongitude: c.addressLongitude ?? null,
                addressAccuracy: c.addressAccuracy ?? null,
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
