"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUploadCases = exports.updateSettings = exports.getSettings = exports.getProfile = exports.getAnalytics = exports.getAuditLogs = exports.generateReport = exports.getReports = exports.createBranch = exports.getBranches = exports.updateCaseStatus = exports.assignCase = exports.getCases = exports.toggleAgentStatus = exports.getAgents = exports.createCustomerAndCase = exports.getCustomers = exports.getDashboard = void 0;
const db_1 = __importDefault(require("../config/db"));
const apiError = (res, message, status = 500, error) => res.status(status).json({ success: false, message, error: error?.message ?? error });
const toTitleCase = (value) => value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
const formatDateTime = (date) => new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
}).format(date);
const parseFullName = (firstName, lastName) => `${firstName} ${lastName}`.trim();
function resolveAgentName(agent) {
    return agent ? parseFullName(agent.firstName, agent.lastName) : 'Not Assigned';
}
function resolveCaseStatus(status) {
    return toTitleCase(status.replace('_', ' '));
}
async function ensureSettings() {
    const existing = await db_1.default.systemSetting.findFirst();
    if (existing)
        return existing;
    return db_1.default.systemSetting.create({
        data: {
            orgName: 'Apex Financial Services Ltd.',
            adminEmail: 'admin@lvms.com',
            slaDays: 3,
            emailOverdue: true,
            emailDigest: true,
            notifyNewUpload: false,
            notifyCaseComplete: false,
        },
    });
}
// ─── Dashboard ─────────────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
    try {
        const [customers, cases, agents, reports, logs, branches] = await Promise.all([
            db_1.default.customer.findMany({ include: { verificationCases: true } }),
            db_1.default.verificationCase.findMany({
                include: {
                    customer: true,
                    agent: { select: { firstName: true, lastName: true, branch: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            db_1.default.user.findMany({
                where: { role: 'FIELD_AGENT' },
                include: { assignedCases: true },
            }),
            db_1.default.report.findMany({ orderBy: { createdAt: 'desc' } }),
            db_1.default.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
            db_1.default.branch.findMany(),
        ]);
        const completedCases = cases.filter((item) => item.status === 'COMPLETED');
        const pendingCases = cases.filter((item) => item.status === 'PENDING' || item.status === 'ASSIGNED');
        const activeAgents = agents.filter((item) => item.isActive).length;
        const recentCases = cases.slice(0, 8).map((item) => ({
            id: item.id,
            customer: parseFullName(item.customer.firstName, item.customer.lastName),
            type: item.type === 'RESIDENTIAL' ? 'Residential' : 'Business',
            status: resolveCaseStatus(item.status),
            agent: resolveAgentName(item.agent ?? null),
            updatedOn: formatDateTime(item.updatedAt),
        }));
        const topAgents = agents
            .map((agent) => {
            const assignedCases = agent.assignedCases;
            const completed = assignedCases.filter((item) => item.status === 'COMPLETED').length;
            const inProgress = assignedCases.filter((item) => item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS').length;
            const rate = assignedCases.length === 0 ? 0 : Math.round((completed / assignedCases.length) * 100);
            const completedDurations = assignedCases
                .filter((item) => item.status === 'COMPLETED' && item.completedAt)
                .map((item) => Math.max(1, Math.round((new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime()) / 86400000)));
            const avgTurnaround = completedDurations.length
                ? `${(completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length).toFixed(1)} days`
                : '1.5 days';
            return {
                name: parseFullName(agent.firstName, agent.lastName),
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
        ];
        const recentActivity = logs.slice(0, 4).map((log) => ({
            icon: log.action.includes('Approved') || log.action.includes('Completed') ? 'success' : log.action.includes('Assigned') ? 'info' : log.action.includes('Uploaded') ? 'upload' : 'activity',
            bg: log.action.includes('Approved') || log.action.includes('Completed') ? 'bg-teal-50' : log.action.includes('Assigned') ? 'bg-blue-50' : 'bg-amber-50',
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
            if (item.status === 'PENDING' || item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS')
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
        return res.status(200).json({
            success: true,
            data: {
                kpis,
                recentCases,
                topAgents,
                recentActivity,
                branches: branchStats,
                reports,
                lineData,
                pieData,
            },
        });
    }
    catch (error) {
        return apiError(res, 'Failed to load dashboard data', 500, error);
    }
};
exports.getDashboard = getDashboard;
// ─── Customers ─────────────────────────────────────────────────────────────
const getCustomers = async (req, res) => {
    try {
        const customers = await db_1.default.customer.findMany({
            include: {
                verificationCases: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const data = customers.map((customer) => {
            const latestCase = customer.verificationCases[0];
            return {
                id: customer.applicationId,
                name: parseFullName(customer.firstName, customer.lastName),
                phone: customer.phone ?? '',
                address: customer.address,
                loanType: customer.loanType,
                caseStatus: resolveCaseStatus(latestCase?.status ?? 'PENDING'),
                branch: customer.branch ?? latestCase?.branch ?? 'Unassigned',
                uploadDate: formatDateTime(customer.updatedAt),
            };
        });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return apiError(res, 'Failed to load customers', 500, error);
    }
};
exports.getCustomers = getCustomers;
const createCustomerAndCase = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address, loanAmount, businessName, type, loanType, branch } = req.body;
        const customer = await db_1.default.customer.create({
            data: {
                applicationId: `APP-${Date.now()}`,
                firstName,
                lastName,
                email,
                phone,
                address,
                loanAmount: Number(loanAmount),
                businessName,
                loanType: loanType || 'Home Loan',
                branch,
                verificationCases: {
                    create: {
                        type: type || 'RESIDENTIAL',
                        status: 'PENDING',
                        branch,
                    },
                },
            },
            include: { verificationCases: true },
        });
        await db_1.default.auditLog.create({
            data: {
                actor: 'Admin',
                action: 'Created customer and case',
                entity: `Customer ${parseFullName(firstName, lastName)} (${customer.applicationId})`,
                timestamp: new Date().toISOString(),
                ip: req.ip || 'system',
            },
        });
        return res.status(201).json({ success: true, message: 'Customer and pending case created successfully', data: customer });
    }
    catch (error) {
        return apiError(res, 'Failed to create customer', 500, error);
    }
};
exports.createCustomerAndCase = createCustomerAndCase;
// ─── Agents ────────────────────────────────────────────────────────────────
const getAgents = async (req, res) => {
    try {
        const agents = await db_1.default.user.findMany({
            where: { role: 'FIELD_AGENT' },
            include: { assignedCases: true },
            orderBy: { createdAt: 'asc' },
        });
        const data = agents.map((agent) => {
            const assignedCases = agent.assignedCases;
            const completedCases = assignedCases.filter((item) => item.status === 'COMPLETED').length;
            const activeCases = assignedCases.filter((item) => item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS').length;
            const successRate = assignedCases.length === 0 ? 0 : Math.round((completedCases / assignedCases.length) * 100);
            const completedDurations = assignedCases
                .filter((item) => item.status === 'COMPLETED' && item.completedAt)
                .map((item) => Math.max(1, Math.round((new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime()) / 86400000)));
            const avgTurnaround = completedDurations.length
                ? `${(completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length).toFixed(1)} days`
                : '1.5 days';
            return {
                id: agent.id,
                name: parseFullName(agent.firstName, agent.lastName),
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
        return apiError(res, 'Failed to load agents', 500, error);
    }
};
exports.getAgents = getAgents;
const toggleAgentStatus = async (req, res) => {
    try {
        const agentId = req.params.agentId;
        const agent = await db_1.default.user.findUnique({ where: { id: agentId } });
        if (!agent)
            return res.status(404).json({ success: false, message: 'Agent not found' });
        const updated = await db_1.default.user.update({
            where: { id: agentId },
            data: { isActive: !agent.isActive },
        });
        return res.status(200).json({ success: true, message: `Agent ${updated.isActive ? 'activated' : 'deactivated'}`, data: updated });
    }
    catch (error) {
        return apiError(res, 'Failed to toggle agent status', 500, error);
    }
};
exports.toggleAgentStatus = toggleAgentStatus;
// ─── Cases ─────────────────────────────────────────────────────────────────
const getCases = async (req, res) => {
    try {
        const { status } = req.query;
        const cases = await db_1.default.verificationCase.findMany({
            where: status ? { status: status } : undefined,
            include: {
                customer: true,
                agent: { select: { firstName: true, lastName: true, branch: true } },
                media: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const data = cases.map((item) => ({
            id: item.id,
            customer: parseFullName(item.customer.firstName, item.customer.lastName),
            type: item.type === 'RESIDENTIAL' ? 'Residential' : 'Business',
            status: resolveCaseStatus(item.status),
            agent: resolveAgentName(item.agent ?? null),
            branch: item.branch ?? item.agent?.branch ?? item.customer.branch ?? 'Unassigned',
            slaDue: formatDateTime(item.createdAt),
            overdue: item.status !== 'COMPLETED' && item.status !== 'REJECTED',
        }));
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return apiError(res, 'Failed to load cases', 500, error);
    }
};
exports.getCases = getCases;
const assignCase = async (req, res) => {
    try {
        const caseId = req.params.caseId;
        const agentId = req.body.agentId;
        const agent = await db_1.default.user.findUnique({ where: { id: agentId, role: 'FIELD_AGENT' } });
        if (!agent)
            return res.status(404).json({ success: false, message: 'Field Agent not found' });
        const updatedCase = await db_1.default.verificationCase.update({
            where: { id: caseId },
            data: { agentId, status: 'ASSIGNED' },
        });
        await db_1.default.auditLog.create({
            data: {
                actor: 'Admin',
                action: 'Assigned case to agent',
                entity: `Case ${caseId} → ${parseFullName(agent.firstName, agent.lastName)}`,
                timestamp: new Date().toISOString(),
                ip: req.ip || 'system',
            },
        });
        return res.status(200).json({ success: true, message: 'Case assigned successfully', data: updatedCase });
    }
    catch (error) {
        return apiError(res, 'Failed to assign case', 500, error);
    }
};
exports.assignCase = assignCase;
const updateCaseStatus = async (req, res) => {
    try {
        const caseId = req.params.caseId;
        const { status } = req.body;
        if (!['COMPLETED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status update' });
        }
        const updatedCase = await db_1.default.verificationCase.update({
            where: { id: caseId },
            data: { status, completedAt: status === 'COMPLETED' ? new Date() : null },
        });
        return res.status(200).json({ success: true, message: `Case marked as ${status}`, data: updatedCase });
    }
    catch (error) {
        return apiError(res, 'Failed to update case status', 500, error);
    }
};
exports.updateCaseStatus = updateCaseStatus;
// ─── Branches ──────────────────────────────────────────────────────────────
const getBranches = async (req, res) => {
    try {
        const [branches, agents, cases] = await Promise.all([
            db_1.default.branch.findMany({ orderBy: { createdAt: 'asc' } }),
            db_1.default.user.findMany({ where: { role: 'FIELD_AGENT' } }),
            db_1.default.verificationCase.findMany({ include: { agent: { select: { branch: true } } } }),
        ]);
        const data = branches.map((branch) => {
            const branchAgents = agents.filter((a) => a.branch === branch.name);
            const branchCases = cases.filter((c) => c.branch === branch.name || c.agent?.branch === branch.name);
            return {
                id: branch.id,
                name: branch.name,
                city: branch.city,
                agents: branchAgents.length,
                activeCases: branchCases.filter((c) => c.status !== 'COMPLETED' && c.status !== 'REJECTED').length,
                manager: branch.manager,
                phone: branch.phone ?? '—',
            };
        });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return apiError(res, 'Failed to load branches', 500, error);
    }
};
exports.getBranches = getBranches;
const createBranch = async (req, res) => {
    try {
        const { name, city, manager, phone } = req.body;
        if (!name || !city || !manager) {
            return res.status(400).json({ success: false, message: 'Name, city and manager are required' });
        }
        const created = await db_1.default.branch.create({ data: { name, city, manager, phone: phone || null } });
        await db_1.default.auditLog.create({
            data: {
                actor: 'Admin',
                action: 'Created branch',
                entity: `Branch ${created.name}`,
                timestamp: new Date().toISOString(),
                ip: req.ip || 'system',
            },
        });
        return res.status(201).json({ success: true, message: 'Branch created successfully', data: created });
    }
    catch (error) {
        return apiError(res, 'Failed to create branch', 500, error);
    }
};
exports.createBranch = createBranch;
// ─── Reports ───────────────────────────────────────────────────────────────
const getReports = async (req, res) => {
    try {
        const reports = await db_1.default.report.findMany({ orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ success: true, data: reports });
    }
    catch (error) {
        return apiError(res, 'Failed to load reports', 500, error);
    }
};
exports.getReports = getReports;
const generateReport = async (req, res) => {
    try {
        const { reportType, format, dateRange } = req.body;
        if (!reportType || !format) {
            return res.status(400).json({ success: false, message: 'Report type and format are required' });
        }
        const reportNames = {
            weekly: 'Weekly Verification Summary',
            agent: 'Agent Performance Report',
            branch: 'Branch Coverage Report',
            audit: 'Cases Audit Export',
        };
        const name = reportNames[reportType] ?? 'Generated Report';
        const generatedReport = await db_1.default.report.create({
            data: {
                name,
                type: format.toUpperCase() === 'PDF' ? 'PDF' : 'Excel',
                generatedBy: 'Admin',
                generatedAt: formatDateTime(new Date()),
                size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
                dateRange,
                format,
            },
        });
        return res.status(201).json({ success: true, message: 'Report generated successfully', data: generatedReport });
    }
    catch (error) {
        return apiError(res, 'Failed to generate report', 500, error);
    }
};
exports.generateReport = generateReport;
// ─── Audit Logs ────────────────────────────────────────────────────────────
const getAuditLogs = async (req, res) => {
    try {
        const logs = await db_1.default.auditLog.findMany({ orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ success: true, data: logs });
    }
    catch (error) {
        return apiError(res, 'Failed to load audit logs', 500, error);
    }
};
exports.getAuditLogs = getAuditLogs;
// ─── Analytics ─────────────────────────────────────────────────────────────
const getAnalytics = async (req, res) => {
    try {
        const totalAgents = await db_1.default.user.count({ where: { role: 'FIELD_AGENT', isActive: true } });
        const totalCustomers = await db_1.default.customer.count();
        const totalBranches = await db_1.default.branch.count();
        const casesByStatus = await db_1.default.verificationCase.groupBy({
            by: ['status'],
            _count: { status: true },
        });
        return res.status(200).json({
            success: true,
            data: {
                totalAgents,
                totalCustomers,
                totalBranches,
                caseBreakdown: casesByStatus.map((c) => ({ status: c.status, count: c._count.status })),
            },
        });
    }
    catch (error) {
        return apiError(res, 'Failed to load analytics', 500, error);
    }
};
exports.getAnalytics = getAnalytics;
// ─── Profile ───────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await db_1.default.user.findUnique({ where: { id: userId }, include: { assignedCases: true } });
        if (!user)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const reportsGenerated = await db_1.default.report.count();
        const uploadsProcessed = await db_1.default.uploadBatch.count();
        const activeAgents = await db_1.default.user.count({ where: { role: 'FIELD_AGENT', isActive: true } });
        return res.status(200).json({
            success: true,
            data: {
                name: parseFullName(user.firstName, user.lastName),
                role: user.role === 'ADMIN' ? 'System Administrator' : 'Field Agent',
                email: user.email,
                phone: user.phone ?? '',
                branch: user.branch ?? 'Unassigned',
                joined: formatDateTime(user.createdAt),
                stats: [
                    { label: 'Cases Managed', value: user.assignedCases.length.toLocaleString() },
                    { label: 'Agents Under You', value: activeAgents.toLocaleString() },
                    { label: 'Reports Generated', value: reportsGenerated.toLocaleString() },
                    { label: 'Uploads Processed', value: uploadsProcessed.toLocaleString() },
                ],
            },
        });
    }
    catch (error) {
        return apiError(res, 'Failed to load profile', 500, error);
    }
};
exports.getProfile = getProfile;
// ─── Settings ──────────────────────────────────────────────────────────────
const getSettings = async (req, res) => {
    try {
        const settings = await ensureSettings();
        return res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        return apiError(res, 'Failed to load settings', 500, error);
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const current = await ensureSettings();
        const { orgName, adminEmail, slaDays, toggles } = req.body;
        const updated = await db_1.default.systemSetting.update({
            where: { id: current.id },
            data: {
                orgName: orgName ?? current.orgName,
                adminEmail: adminEmail ?? current.adminEmail,
                slaDays: Number.isFinite(Number(slaDays)) ? Number(slaDays) : current.slaDays,
                emailOverdue: toggles?.['Email alerts for overdue cases'] ?? current.emailOverdue,
                emailDigest: toggles?.['Email digest — daily summary'] ?? current.emailDigest,
                notifyNewUpload: toggles?.['Notify on new Excel upload'] ?? current.notifyNewUpload,
                notifyCaseComplete: toggles?.['Notify when agent completes a case'] ?? current.notifyCaseComplete,
            },
        });
        return res.status(200).json({ success: true, message: 'Settings saved successfully', data: updated });
    }
    catch (error) {
        return apiError(res, 'Failed to update settings', 500, error);
    }
};
exports.updateSettings = updateSettings;
// ─── Bulk Upload ──────────────────────────────────────────────────────────
const bulkUploadCases = async (req, res) => {
    try {
        const { rows } = req.body;
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return apiError(res, 'No valid rows provided', 400);
        }
        let successCount = 0;
        for (const row of rows) {
            if (!row.name || !row.phone || !row.address)
                continue;
            const [firstName, ...lastNameParts] = row.name.split(' ');
            const lastName = lastNameParts.join(' ') || '';
            const customer = await db_1.default.customer.create({
                data: {
                    applicationId: `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    firstName,
                    lastName,
                    phone: String(row.phone),
                    address: String(row.address),
                    loanAmount: Number(row.loanAmount) || 0,
                    loanType: row.loanType || 'Personal',
                }
            });
            await db_1.default.verificationCase.create({
                data: {
                    customerId: customer.id,
                    status: 'PENDING',
                    type: 'ADDRESS',
                }
            });
            successCount++;
        }
        await db_1.default.auditLog.create({
            data: {
                action: `Bulk uploaded ${successCount} cases from Excel`,
                actor: 'Admin',
                entity: 'Upload Module',
                ip: req.ip || '127.0.0.1',
                timestamp: new Date().toISOString()
            }
        });
        return res.status(200).json({
            success: true,
            message: `Successfully imported ${successCount} cases`,
            count: successCount
        });
    }
    catch (error) {
        return apiError(res, 'Bulk upload failed', 500, error);
    }
};
exports.bulkUploadCases = bulkUploadCases;
