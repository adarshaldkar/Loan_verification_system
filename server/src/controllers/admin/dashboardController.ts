import { Response, Request } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { parseFullName, resolveCaseStatus, resolveAgentName, formatDateTime, apiError } from '../../utils/helpers';

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

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const totalAgents = await prisma.user.count({ where: { role: 'FIELD_AGENT', isActive: true } });
    const totalCustomers = await prisma.customer.count();
    const totalBranches = await prisma.branch.count();
    const casesByStatus = await prisma.verificationCase.groupBy({
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
  } catch (error: any) {
    return apiError(res, 'Failed to load analytics', 500, error);
  }
};
