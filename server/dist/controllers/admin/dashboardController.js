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
        const isSuperAdmin = requester?.role === 'SUPER_ADMIN';
        const filter = isSuperAdmin ? {} : { adminId };
        const agentFilter = isSuperAdmin ? { role: 'FIELD_AGENT' } : { role: 'FIELD_AGENT', adminId };
        // ── 1. Parse Period & Date Range Filter ──
        const period = (req.query.period || 'This Week').toLowerCase().trim();
        const startDateParam = req.query.startDate;
        const endDateParam = req.query.endDate;
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();
        let prevStartDate = new Date();
        let prevEndDate = new Date();
        let isHourly = false;
        let numBuckets = 7;
        if (startDateParam && endDateParam) {
            startDate = new Date(startDateParam);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(endDateParam);
            endDate.setHours(23, 59, 59, 999);
            const spanDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
            prevStartDate = new Date(startDate.getTime() - spanDays * 86400000);
            prevEndDate = new Date(startDate.getTime() - 1);
            numBuckets = Math.min(10, spanDays);
        }
        else if (period.includes('today')) {
            isHourly = true;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            prevStartDate = new Date(startDate.getTime() - 86400000);
            prevEndDate = new Date(startDate.getTime() - 1);
        }
        else if (period.includes('last week')) {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 13);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setDate(endDate.getDate() - 7);
            endDate.setHours(23, 59, 59, 999);
            prevStartDate = new Date(startDate.getTime() - 7 * 86400000);
            prevEndDate = new Date(startDate.getTime() - 1);
            numBuckets = 7;
        }
        else if (period.includes('month')) {
            if (period.includes('last month')) {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            }
            else {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                endDate = new Date();
            }
            const spanDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
            prevStartDate = new Date(startDate.getTime() - spanDays * 86400000);
            prevEndDate = new Date(startDate.getTime() - 1);
            numBuckets = Math.min(8, spanDays);
        }
        else {
            // Default: This Week (Past 7 days)
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            prevStartDate = new Date(startDate.getTime() - 7 * 86400000);
            prevEndDate = new Date(startDate.getTime() - 1);
            numBuckets = 7;
        }
        // Query recent cases prioritizing active date period with fallback to latest cases
        let recentCasesRaw = await db_1.default.verificationCase.findMany({
            where: {
                ...filter,
                createdAt: { gte: startDate, lte: endDate },
            },
            include: {
                customer: true,
                agent: { select: { firstName: true, lastName: true, branch: true } },
            },
            orderBy: { updatedAt: 'desc' },
            take: 10,
        });
        if (recentCasesRaw.length === 0) {
            recentCasesRaw = await db_1.default.verificationCase.findMany({
                where: filter,
                include: {
                    customer: true,
                    agent: { select: { firstName: true, lastName: true, branch: true } },
                },
                orderBy: { updatedAt: 'desc' },
                take: 10,
            });
        }
        const [totalCustomersCount, totalCasesCount, caseCountsByStatus, agents, logs, branches, activeAgentsCount, chartCases, prevCasesCount, prevCompletedCount, prevPendingCount, allCasesForReverif,] = await Promise.all([
            db_1.default.customer.count({ where: filter }),
            db_1.default.verificationCase.count({ where: filter }),
            db_1.default.verificationCase.groupBy({
                by: ['status'],
                where: filter,
                _count: { status: true },
            }),
            db_1.default.user.findMany({
                where: agentFilter,
                include: {
                    assignedCases: {
                        select: { id: true, status: true, createdAt: true, completedAt: true },
                    },
                },
            }),
            db_1.default.auditLog.findMany({ where: filter, orderBy: { createdAt: 'desc' }, take: 8 }),
            db_1.default.branch.findMany(),
            db_1.default.user.count({ where: { ...agentFilter, isActive: true } }),
            db_1.default.verificationCase.findMany({
                where: {
                    ...filter,
                    createdAt: { gte: startDate, lte: endDate },
                },
                select: { createdAt: true, status: true },
                orderBy: { createdAt: 'asc' },
            }),
            // Previous period stats for dynamic trends
            db_1.default.verificationCase.count({
                where: { ...filter, createdAt: { gte: prevStartDate, lte: prevEndDate } },
            }),
            db_1.default.verificationCase.count({
                where: {
                    ...filter,
                    createdAt: { gte: prevStartDate, lte: prevEndDate },
                    status: { in: ['COMPLETED', 'APPROVED'] },
                },
            }),
            db_1.default.verificationCase.count({
                where: {
                    ...filter,
                    createdAt: { gte: prevStartDate, lte: prevEndDate },
                    status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
                },
            }),
            db_1.default.verificationCase.findMany({
                where: filter,
                select: { profileData: true },
            }),
        ]);
        const statusMap = {};
        caseCountsByStatus.forEach((g) => {
            statusMap[g.status] = g._count.status;
        });
        const completedCases = (statusMap['COMPLETED'] || 0) + (statusMap['APPROVED'] || 0);
        const pendingCases = (statusMap['PENDING'] || 0) + (statusMap['ASSIGNED'] || 0);
        const inProgressCases = statusMap['IN_PROGRESS'] || 0;
        const totalPendingAndInProgress = pendingCases + inProgressCases;
        const rejectedCount = statusMap['REJECTED'] || 0;
        const reverificationCount = allCasesForReverif.filter((item) => {
            try {
                const pd = typeof item.profileData === 'string' ? JSON.parse(item.profileData) : item.profileData;
                return pd?.adminReview?.decision === 'NEEDS_REVISION';
            }
            catch {
                return false;
            }
        }).length;
        const calcTrend = (current, prev) => {
            if (prev === 0)
                return current > 0 ? 100 : 0;
            return Math.round(((current - prev) / prev) * 100);
        };
        const casesTrend = calcTrend(chartCases.length, prevCasesCount);
        const completedTrend = calcTrend(chartCases.filter((c) => c.status === 'COMPLETED' || c.status === 'APPROVED').length, prevCompletedCount);
        const pendingTrend = calcTrend(chartCases.filter((c) => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length, prevPendingCount);
        const recentCases = recentCasesRaw.map((item) => ({
            id: item.id,
            customer: (0, helpers_1.parseFullName)(item.customer?.firstName, item.customer?.lastName),
            type: item.type,
            status: (0, helpers_1.resolveCaseStatus)(item.status),
            agent: (0, helpers_1.resolveAgentName)(item.agent ?? null),
            branch: item.branch ?? item.agent?.branch ?? item.customer?.branch ?? 'Unassigned',
            updatedOn: (0, helpers_1.formatDateTime)(item.updatedAt || item.createdAt),
        }));
        // Compute top agents with period awareness and fallback
        const topAgents = agents
            .map((agent) => {
            const assignedCases = agent.assignedCases;
            const periodCases = assignedCases.filter((item) => {
                const d = new Date(item.createdAt);
                return d >= startDate && d <= endDate;
            });
            // Use period cases if available; otherwise use all assigned cases
            const casesToUse = periodCases.length > 0 ? periodCases : assignedCases;
            const completed = casesToUse.filter((item) => item.status === 'COMPLETED' || item.status === 'APPROVED').length;
            const inProgress = casesToUse.filter((item) => item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS').length;
            const total = casesToUse.length;
            const rate = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
            const completedDurations = casesToUse
                .filter((item) => (item.status === 'COMPLETED' || item.status === 'APPROVED') && item.completedAt)
                .map((item) => Math.max(1, Math.round((new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime()) / 86400000)));
            const avgTurnaround = completedDurations.length
                ? `${(completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length).toFixed(1)} days`
                : '—';
            return {
                id: agent.id,
                name: (0, helpers_1.parseFullName)(agent.firstName, agent.lastName),
                completed,
                inProgress,
                total,
                rate,
                avgTurnaround,
            };
        })
            .sort((a, b) => b.completed - a.completed || b.rate - a.rate)
            .slice(0, 6);
        const branchStats = branches.map((branch) => {
            const branchAgents = agents.filter((agent) => agent.branch === branch.name);
            return {
                id: branch.id,
                name: branch.name,
                city: branch.city,
                agents: branchAgents.length,
                activeCases: 0,
                manager: branch.manager,
                phone: branch.phone ?? '—',
            };
        });
        const kpis = [
            { label: 'Total Customers', value: totalCustomersCount, trend: casesTrend },
            { label: 'Total Cases', value: totalCasesCount, trend: casesTrend },
            { label: 'Pending Cases', value: totalPendingAndInProgress, trend: pendingTrend },
            { label: 'Completed Cases', value: completedCases, trend: completedTrend },
            { label: 'Active Agents', value: activeAgentsCount, trend: 0 },
            { label: 'Branches', value: branches.length, trend: 0 },
            { label: 'Rejected Cases', value: rejectedCount, trend: 0 },
            { label: 'Re-verification', value: reverificationCount, trend: 0 },
        ];
        const recentActivity = logs.slice(0, 4).map((log) => ({
            icon: log.action.includes('Completed') ? 'success' : log.action.includes('Assigned') ? 'info' : 'activity',
            bg: log.action.includes('Completed') ? 'bg-teal-50' : log.action.includes('Assigned') ? 'bg-blue-50' : 'bg-amber-50',
            title: log.action,
            desc: log.entity,
            time: log.timestamp,
        }));
        // ── Dynamic Line Chart Bucketing ──
        const lineData = [];
        if (isHourly) {
            const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
            const hourlyMap = new Map();
            hours.forEach((h) => hourlyMap.set(h, { total: 0, completed: 0, pending: 0, rejected: 0 }));
            for (const item of chartCases) {
                const itemHour = new Date(item.createdAt).getHours();
                const matchedHour = hours.reduce((prev, curr) => {
                    const currH = parseInt(curr.split(':')[0], 10);
                    return itemHour >= currH ? curr : prev;
                }, hours[0]);
                const b = hourlyMap.get(matchedHour) || hourlyMap.get(hours[0]);
                b.total += 1;
                if (item.status === 'COMPLETED' || item.status === 'APPROVED')
                    b.completed += 1;
                if (['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(item.status))
                    b.pending += 1;
                if (item.status === 'REJECTED')
                    b.rejected += 1;
            }
            hourlyMap.forEach((val, label) => {
                lineData.push({ date: label, ...val });
            });
        }
        else {
            const dayBuckets = new Map();
            const stepMs = (endDate.getTime() - startDate.getTime()) / Math.max(1, numBuckets - 1);
            for (let i = 0; i < numBuckets; i++) {
                const d = new Date(startDate.getTime() + i * stepMs);
                const key = d.toISOString().slice(0, 10);
                dayBuckets.set(key, { total: 0, completed: 0, pending: 0, rejected: 0 });
            }
            for (const item of chartCases) {
                const itemDateStr = new Date(item.createdAt).toISOString().slice(0, 10);
                let closestKey = Array.from(dayBuckets.keys())[0];
                let minDiff = Infinity;
                for (const k of dayBuckets.keys()) {
                    const diff = Math.abs(new Date(k).getTime() - new Date(itemDateStr).getTime());
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestKey = k;
                    }
                }
                const b = dayBuckets.get(closestKey);
                b.total += 1;
                if (item.status === 'COMPLETED' || item.status === 'APPROVED')
                    b.completed += 1;
                if (['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(item.status))
                    b.pending += 1;
                if (item.status === 'REJECTED')
                    b.rejected += 1;
            }
            dayBuckets.forEach((val, key) => {
                lineData.push({
                    date: new Date(`${key}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                    ...val,
                });
            });
        }
        const pieData = [
            { name: 'Pending', value: pendingCases, color: '#B45309' },
            { name: 'In Progress', value: inProgressCases, color: '#1D4ED8' },
            { name: 'Completed', value: completedCases, color: '#0D9488' },
            { name: 'Rejected', value: rejectedCount, color: '#BE123C' },
        ];
        // ── Dynamic Admin Performance Overview (Super Admin + Admin Team) ──
        let adminPerformance = [];
        if (isSuperAdmin || requester?.role === 'ADMIN') {
            const admins = await db_1.default.user.findMany({
                where: isSuperAdmin ? { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } : { id: adminId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                },
            });
            const allCases = await db_1.default.verificationCase.findMany({
                select: {
                    adminId: true,
                    status: true,
                    profileData: true,
                    createdAt: true,
                    customer: { select: { adminId: true } },
                },
            });
            adminPerformance = admins.map((adm) => {
                const adminCases = allCases.filter((c) => c.adminId === adm.id || c.customer?.adminId === adm.id);
                const periodAdminCases = adminCases.filter((c) => {
                    const d = new Date(c.createdAt);
                    return d >= startDate && d <= endDate;
                });
                const casesToUse = periodAdminCases.length > 0 ? periodAdminCases : adminCases;
                const total = casesToUse.length;
                const pending = casesToUse.filter((c) => ['PENDING', 'ASSIGNED'].includes(c.status)).length;
                const inProgress = casesToUse.filter((c) => c.status === 'IN_PROGRESS').length;
                const completed = casesToUse.filter((c) => c.status === 'COMPLETED').length;
                const verified = casesToUse.filter((c) => c.status === 'APPROVED').length;
                const overall = casesToUse.filter((c) => ['APPROVED', 'REJECTED'].includes(c.status)).length;
                const rejected = casesToUse.filter((c) => c.status === 'REJECTED').length;
                const reverification = casesToUse.filter((item) => {
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
                    name: adm.role === 'SUPER_ADMIN' ? `${(0, helpers_1.parseFullName)(adm.firstName, adm.lastName)} (Super Admin)` : (0, helpers_1.parseFullName)(adm.firstName, adm.lastName),
                    email: adm.email,
                    total,
                    pending: pending + inProgress,
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
        const isSuperAdmin = requester?.role === 'SUPER_ADMIN';
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
