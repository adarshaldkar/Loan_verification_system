"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = exports.getDashboard = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const getDashboard = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const requester = await db_1.default.user.findUnique({ where: { id: adminId } });
        const isSuperAdmin = requester && (requester.email === 'akshaya@gmail.com' || requester.email === 'adarshaldkar@gmail.com');
        const filter = isSuperAdmin ? {} : { adminId };
        const agentFilter = isSuperAdmin ? { role: 'FIELD_AGENT' } : { role: 'FIELD_AGENT', adminId };
        const [customers, cases, agents, logs, branches] = await Promise.all([
            db_1.default.customer.findMany({ where: filter, include: { verificationCases: true } }),
            db_1.default.verificationCase.findMany({
                where: filter,
                include: {
                    customer: true,
                    agent: { select: { firstName: true, lastName: true, branch: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            db_1.default.user.findMany({
                where: agentFilter,
                include: { assignedCases: true },
            }),
            db_1.default.auditLog.findMany({ where: filter, orderBy: { createdAt: 'desc' }, take: 8 }),
            db_1.default.branch.findMany(),
        ]);
        const completedCases = cases.filter((item) => item.status === 'COMPLETED' || item.status === 'APPROVED');
        const pendingCases = cases.filter((item) => item.status === 'PENDING' || item.status === 'ASSIGNED');
        const activeAgents = agents.filter((item) => item.isActive).length;
        const rejectedCount = cases.filter((item) => item.status === 'REJECTED').length;
        const reverificationCount = cases.filter((item) => {
            try {
                const pd = typeof item.profileData === 'string' ? JSON.parse(item.profileData) : item.profileData;
                return pd?.adminReview?.decision === 'NEEDS_REVISION';
            }
            catch {
                return false;
            }
        }).length;
        const recentCases = cases.slice(0, 8).map((item) => ({
            id: item.id,
            customer: (0, helpers_1.parseFullName)(item.customer.firstName, item.customer.lastName),
            type: item.type === 'RESIDENTIAL' ? 'Residential' : 'Business',
            status: (0, helpers_1.resolveCaseStatus)(item.status),
            agent: (0, helpers_1.resolveAgentName)(item.agent ?? null),
            updatedOn: (0, helpers_1.formatDateTime)(item.updatedAt),
        }));
        const topAgents = agents
            .map((agent) => {
            const assignedCases = agent.assignedCases;
            const completed = assignedCases.filter((item) => item.status === 'COMPLETED' || item.status === 'APPROVED').length;
            const inProgress = assignedCases.filter((item) => item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS').length;
            const rate = assignedCases.length === 0 ? 0 : Math.round((completed / assignedCases.length) * 100);
            const completedDurations = assignedCases
                .filter((item) => (item.status === 'COMPLETED' || item.status === 'APPROVED') && item.completedAt)
                .map((item) => Math.max(1, Math.round((new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime()) / 86400000)));
            const avgTurnaround = completedDurations.length
                ? `${(completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length).toFixed(1)} days`
                : '—';
            return {
                name: (0, helpers_1.parseFullName)(agent.firstName, agent.lastName),
                completed,
                inProgress,
                rate,
                avgTurnaround,
            };
        })
            .sort((a, b) => b.completed - a.completed)
            .slice(0, 5);
        const branchStats = branches.map((branch) => {
            const branchAgents = agents.filter((agent) => agent.branch === branch.name);
            const branchCases = cases.filter((item) => item.branch === branch.name || item.agent?.branch === branch.name);
            return {
                id: branch.id,
                name: branch.name,
                city: branch.city,
                agents: branchAgents.length,
                activeCases: branchCases.filter((item) => item.status !== 'COMPLETED' && item.status !== 'REJECTED').length,
                manager: branch.manager,
                phone: branch.phone ?? '—',
            };
        });
        const kpis = [
            { label: 'Total Customers', value: customers.length, trend: 12.4 },
            { label: 'Total Cases', value: cases.length, trend: 10.8 },
            { label: 'Pending Cases', value: pendingCases.length, trend: 7.6 },
            { label: 'Completed Cases', value: completedCases.length, trend: 15.9 },
            { label: 'Active Agents', value: activeAgents, trend: 5.4 },
            { label: 'Branches', value: branches.length, trend: 0 },
            { label: 'Rejected Cases', value: rejectedCount, trend: 0 },
            { label: 'Re-verification Cases', value: reverificationCount, trend: 0 },
        ];
        const recentActivity = logs.slice(0, 4).map((log) => ({
            icon: log.action.includes('Completed') ? 'success' : log.action.includes('Assigned') ? 'info' : 'activity',
            bg: log.action.includes('Completed') ? 'bg-teal-50' : log.action.includes('Assigned') ? 'bg-blue-50' : 'bg-amber-50',
            title: log.action,
            desc: log.entity,
            time: log.timestamp,
        }));
        const dayBuckets = new Map();
        const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            return date;
        });
        for (const day of lastSevenDays) {
            const key = day.toISOString().slice(0, 10);
            dayBuckets.set(key, { total: 0, completed: 0, pending: 0, rejected: 0 });
        }
        for (const item of cases) {
            const key = new Date(item.createdAt).toISOString().slice(0, 10);
            if (!dayBuckets.has(key))
                continue;
            const bucket = dayBuckets.get(key);
            bucket.total += 1;
            if (item.status === 'COMPLETED')
                bucket.completed += 1;
            if (['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(item.status))
                bucket.pending += 1;
            if (item.status === 'REJECTED')
                bucket.rejected += 1;
        }
        const lineData = Array.from(dayBuckets.entries()).map(([key, value]) => ({
            date: new Date(`${key}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            total: value.total,
            completed: value.completed,
            pending: value.pending,
            rejected: value.rejected,
        }));
        const pieData = [
            { name: 'Pending', value: cases.filter((item) => item.status === 'PENDING').length, color: '#B45309' },
            { name: 'In Progress', value: cases.filter((item) => item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS').length, color: '#1D4ED8' },
            { name: 'Completed', value: completedCases.length, color: '#0D9488' },
            { name: 'Rejected', value: cases.filter((item) => item.status === 'REJECTED').length, color: '#BE123C' },
        ];
        let adminPerformance = [];
        if (isSuperAdmin) {
            const admins = await db_1.default.user.findMany({
                where: { role: 'ADMIN' },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                }
            });
            const allCases = await db_1.default.verificationCase.findMany({
                select: {
                    adminId: true,
                    status: true,
                    profileData: true,
                }
            });
            adminPerformance = admins.map(adm => {
                const adminCases = allCases.filter(c => c.adminId === adm.id);
                const total = adminCases.length;
                const pending = adminCases.filter(c => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length;
                const completed = adminCases.filter(c => c.status === 'COMPLETED').length;
                const verified = adminCases.filter(c => c.status === 'APPROVED').length;
                const overall = adminCases.filter(c => ['APPROVED', 'REJECTED'].includes(c.status)).length;
                const rejected = adminCases.filter(c => c.status === 'REJECTED').length;
                const reverification = adminCases.filter((item) => {
                    try {
                        const pd = typeof item.profileData === 'string' ? JSON.parse(item.profileData) : item.profileData;
                        return pd?.adminReview?.decision === 'NEEDS_REVISION';
                    }
                    catch {
                        return false;
                    }
                }).length;
                return {
                    id: adm.id,
                    name: (0, helpers_1.parseFullName)(adm.firstName, adm.lastName),
                    email: adm.email,
                    total,
                    pending,
                    completed,
                    verified,
                    overall,
                    rejected,
                    reverification,
                };
            });
        }
        return res.status(200).json({
            success: true,
            data: { kpis, recentCases, topAgents, recentActivity, branches: branchStats, lineData, pieData, adminPerformance },
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load dashboard data', 500, error);
    }
};
exports.getDashboard = getDashboard;
const getAnalytics = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const requester = await db_1.default.user.findUnique({ where: { id: adminId } });
        const isSuperAdmin = requester && (requester.email === 'akshaya@gmail.com' || requester.email === 'adarshaldkar@gmail.com');
        const filter = isSuperAdmin ? {} : { adminId };
        const agentFilter = isSuperAdmin ? { role: 'FIELD_AGENT', isActive: true } : { role: 'FIELD_AGENT', isActive: true, adminId };
        const [totalAgents, totalCustomers, totalBranches, casesByStatus, allCases] = await Promise.all([
            db_1.default.user.count({ where: agentFilter }),
            db_1.default.customer.count({ where: filter }),
            db_1.default.branch.count(),
            db_1.default.verificationCase.groupBy({
                by: ['status'],
                where: filter,
                _count: { status: true },
            }),
            db_1.default.verificationCase.findMany({
                where: filter,
                select: { profileData: true },
            }),
        ]);
        const reverificationCount = allCases.filter((item) => {
            try {
                const pd = typeof item.profileData === 'string' ? JSON.parse(item.profileData) : item.profileData;
                return pd?.adminReview?.decision === 'NEEDS_REVISION';
            }
            catch {
                return false;
            }
        }).length;
        return res.status(200).json({
            success: true,
            data: {
                totalAgents,
                totalCustomers,
                totalBranches,
                reverificationCount,
                caseBreakdown: casesByStatus.map((c) => ({ status: c.status, count: c._count.status })),
            },
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load analytics', 500, error);
    }
};
exports.getAnalytics = getAnalytics;
