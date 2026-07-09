import { Request, Response } from 'express';
import prisma from '../config/db';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    branch?: string | null;
  };
}

const apiError = (res: Response, message: string, status = 500, error?: any) =>
  res.status(status).json({ success: false, message, error: error?.message ?? error });

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

const parseFullName = (firstName: string, lastName: string) => `${firstName} ${lastName}`.trim();

function resolveAgentName(agent: { firstName: string; lastName: string } | null) {
  return agent ? parseFullName(agent.firstName, agent.lastName) : 'Not Assigned';
}

function resolveCaseStatus(status: string) {
  return toTitleCase(status.replace('_', ' '));
}

async function ensureSettings() {
  const existing = await prisma.systemSetting.findFirst();
  if (existing) return existing;

  return prisma.systemSetting.create({
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

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const [customers, cases, agents, reports, logs, branches] = await Promise.all([
      prisma.customer.findMany({ include: { verificationCases: true } }),
      prisma.verificationCase.findMany({
        include: {
          customer: true,
          agent: { select: { firstName: true, lastName: true, branch: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findMany({
        where: { role: 'FIELD_AGENT' },
        include: { assignedCases: true },
      }),
      prisma.report.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
      prisma.branch.findMany(),
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
          .map((item) => Math.max(1, Math.round((new Date(item.completedAt as Date).getTime() - new Date(item.createdAt).getTime()) / 86400000)));
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

    const dayBuckets = new Map<string, { total: number; completed: number; pending: number; rejected: number }>();
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
      if (!dayBuckets.has(key)) continue;
      const bucket = dayBuckets.get(key)!;
      bucket.total += 1;
      if (item.status === 'COMPLETED') bucket.completed += 1;
      if (item.status === 'PENDING' || item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS') bucket.pending += 1;
      if (item.status === 'REJECTED') bucket.rejected += 1;
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
  } catch (error: any) {
    return apiError(res, 'Failed to load dashboard data', 500, error);
  }
};

// ─── Customers ─────────────────────────────────────────────────────────────

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
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
  } catch (error: any) {
    return apiError(res, 'Failed to load customers', 500, error);
  }
};

export const createCustomerAndCase = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, address, loanAmount, businessName, type, loanType, branch } = req.body;

    const customer = await prisma.customer.create({
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

    await prisma.auditLog.create({
      data: {
        actor: 'Admin',
        action: 'Created customer and case',
        entity: `Customer ${parseFullName(firstName, lastName)} (${customer.applicationId})`,
        timestamp: new Date().toISOString(),
        ip: req.ip || 'system',
      },
    });

    return res.status(201).json({ success: true, message: 'Customer and pending case created successfully', data: customer });
  } catch (error: any) {
    return apiError(res, 'Failed to create customer', 500, error);
  }
};

// ─── Agents ────────────────────────────────────────────────────────────────

export const getAgents = async (req: Request, res: Response) => {
  try {
    const agents = await prisma.user.findMany({
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
        .map((item) => Math.max(1, Math.round((new Date(item.completedAt as Date).getTime() - new Date(item.createdAt).getTime()) / 86400000)));
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
  } catch (error: any) {
    return apiError(res, 'Failed to load agents', 500, error);
  }
};

export const toggleAgentStatus = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

    const updated = await prisma.user.update({
      where: { id: agentId },
      data: { isActive: !agent.isActive },
    });

    return res.status(200).json({ success: true, message: `Agent ${updated.isActive ? 'activated' : 'deactivated'}`, data: updated });
  } catch (error: any) {
    return apiError(res, 'Failed to toggle agent status', 500, error);
  }
};

// ─── Cases ─────────────────────────────────────────────────────────────────

export const getCases = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const cases = await prisma.verificationCase.findMany({
      where: status ? { status: status as string } : undefined,
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
  } catch (error: any) {
    return apiError(res, 'Failed to load cases', 500, error);
  }
};

export const assignCase = async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;
    const { agentId } = req.body;
    const agent = await prisma.user.findUnique({ where: { id: agentId, role: 'FIELD_AGENT' } });
    if (!agent) return res.status(404).json({ success: false, message: 'Field Agent not found' });

    const updatedCase = await prisma.verificationCase.update({
      where: { id: caseId },
      data: { agentId, status: 'ASSIGNED' },
    });

    await prisma.auditLog.create({
      data: {
        actor: 'Admin',
        action: 'Assigned case to agent',
        entity: `Case ${caseId} → ${parseFullName(agent.firstName, agent.lastName)}`,
        timestamp: new Date().toISOString(),
        ip: req.ip || 'system',
      },
    });

    return res.status(200).json({ success: true, message: 'Case assigned successfully', data: updatedCase });
  } catch (error: any) {
    return apiError(res, 'Failed to assign case', 500, error);
  }
};

export const updateCaseStatus = async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;
    const { status } = req.body;
    if (!['COMPLETED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    const updatedCase = await prisma.verificationCase.update({
      where: { id: caseId },
      data: { status, completedAt: status === 'COMPLETED' ? new Date() : null },
    });

    return res.status(200).json({ success: true, message: `Case marked as ${status}`, data: updatedCase });
  } catch (error: any) {
    return apiError(res, 'Failed to update case status', 500, error);
  }
};

// ─── Branches ──────────────────────────────────────────────────────────────

export const getBranches = async (req: Request, res: Response) => {
  try {
    const [branches, agents, cases] = await Promise.all([
      prisma.branch.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.user.findMany({ where: { role: 'FIELD_AGENT' } }),
      prisma.verificationCase.findMany({ include: { agent: { select: { branch: true } } } }),
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
  } catch (error: any) {
    return apiError(res, 'Failed to load branches', 500, error);
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name, city, manager, phone } = req.body;
    if (!name || !city || !manager) {
      return res.status(400).json({ success: false, message: 'Name, city and manager are required' });
    }

    const created = await prisma.branch.create({ data: { name, city, manager, phone: phone || null } });

    await prisma.auditLog.create({
      data: {
        actor: 'Admin',
        action: 'Created branch',
        entity: `Branch ${created.name}`,
        timestamp: new Date().toISOString(),
        ip: req.ip || 'system',
      },
    });

    return res.status(201).json({ success: true, message: 'Branch created successfully', data: created });
  } catch (error: any) {
    return apiError(res, 'Failed to create branch', 500, error);
  }
};

// ─── Reports ───────────────────────────────────────────────────────────────

export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ success: true, data: reports });
  } catch (error: any) {
    return apiError(res, 'Failed to load reports', 500, error);
  }
};

export const generateReport = async (req: Request, res: Response) => {
  try {
    const { reportType, format, dateRange } = req.body;
    if (!reportType || !format) {
      return res.status(400).json({ success: false, message: 'Report type and format are required' });
    }

    const reportNames: Record<string, string> = {
      weekly: 'Weekly Verification Summary',
      agent: 'Agent Performance Report',
      branch: 'Branch Coverage Report',
      audit: 'Cases Audit Export',
    };

    const name = reportNames[reportType] ?? 'Generated Report';
    const generatedReport = await prisma.report.create({
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
  } catch (error: any) {
    return apiError(res, 'Failed to generate report', 500, error);
  }
};

// ─── Audit Logs ────────────────────────────────────────────────────────────

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ success: true, data: logs });
  } catch (error: any) {
    return apiError(res, 'Failed to load audit logs', 500, error);
  }
};

// ─── Analytics ─────────────────────────────────────────────────────────────

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const totalAgents = await prisma.user.count({ where: { role: 'FIELD_AGENT', isActive: true } });
    const totalCustomers = await prisma.customer.count();
    const casesByStatus = await prisma.verificationCase.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return res.status(200).json({
      success: true,
      data: {
        totalAgents,
        totalCustomers,
        caseBreakdown: casesByStatus.map((c) => ({ status: c.status, count: c._count.status })),
      },
    });
  } catch (error: any) {
    return apiError(res, 'Failed to load analytics', 500, error);
  }
};

// ─── Profile ───────────────────────────────────────────────────────────────

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { assignedCases: true } });
    if (!user) return res.status(404).json({ success: false, message: 'Profile not found' });

    const reportsGenerated = await prisma.report.count();
    const uploadsProcessed = await prisma.uploadBatch.count();
    const activeAgents = await prisma.user.count({ where: { role: 'FIELD_AGENT', isActive: true } });

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
  } catch (error: any) {
    return apiError(res, 'Failed to load profile', 500, error);
  }
};

// ─── Settings ──────────────────────────────────────────────────────────────

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await ensureSettings();
    return res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    return apiError(res, 'Failed to load settings', 500, error);
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const current = await ensureSettings();
    const { orgName, adminEmail, slaDays, toggles } = req.body;

    const updated = await prisma.systemSetting.update({
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
  } catch (error: any) {
    return apiError(res, 'Failed to update settings', 500, error);
  }
};

// ─── Bulk Upload ──────────────────────────────────────────────────────────

export const bulkUploadCases = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = req.body;
    
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return apiError(res, 'No valid rows provided', 400);
    }

    let successCount = 0;

    for (const row of rows) {
      if (!row.name || !row.phone || !row.address) continue;

      const [firstName, ...lastNameParts] = row.name.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const customer = await prisma.customer.create({
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

      await prisma.verificationCase.create({
        data: {
          customerId: customer.id,
          status: 'PENDING',
          type: 'ADDRESS',
        }
      });

      successCount++;
    }

    await prisma.auditLog.create({
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

  } catch (error: any) {
    return apiError(res, 'Bulk upload failed', 500, error);
  }
};

