import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { parseFullName, resolveCaseStatus, resolveAgentName, formatDateTime, apiError } from '../../utils/helpers';

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const requester = await prisma.user.findUnique({ where: { id: adminId } });
    const isSuperAdmin = requester?.role === 'SUPER_ADMIN';

    const filter = isSuperAdmin ? {} : { adminId };
    const agentFilter = isSuperAdmin ? { role: 'FIELD_AGENT' } : { role: 'FIELD_AGENT', adminId };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalCustomersCount,
      totalCasesCount,
      caseCountsByStatus,
      recentCasesRaw,
      agents,
      logs,
      branches,
      activeAgentsCount,
      pastSevenDaysCases,
    ] = await Promise.all([
      (prisma.customer as any).count({ where: filter }),
      (prisma.verificationCase as any).count({ where: filter }),
      (prisma.verificationCase as any).groupBy({
        by: ['status'],
        where: filter,
        _count: { status: true },
      }),
      prisma.verificationCase.findMany({
        where: filter as any,
        include: {
          customer: true,
          agent: { select: { firstName: true, lastName: true, branch: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      (prisma.user as any).findMany({
        where: agentFilter,
        include: {
          assignedCases: {
            select: { id: true, status: true, createdAt: true, completedAt: true },
          },
        },
      }),
      (prisma.auditLog as any).findMany({ where: filter, orderBy: { createdAt: 'desc' }, take: 8 }),
      (prisma.branch as any).findMany(),
      (prisma.user as any).count({ where: { ...agentFilter, isActive: true } }),
      prisma.verificationCase.findMany({
        where: {
          ...(filter as any),
          createdAt: { gte: sevenDaysAgo },
        },
        select: { createdAt: true, status: true },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    caseCountsByStatus.forEach((g: any) => {
      statusMap[g.status] = g._count.status;
    });

    const completedCases = (statusMap['COMPLETED'] || 0) + (statusMap['APPROVED'] || 0);
    const pendingCases = (statusMap['PENDING'] || 0) + (statusMap['ASSIGNED'] || 0) + (statusMap['IN_PROGRESS'] || 0);
    const rejectedCount = statusMap['REJECTED'] || 0;

    const recentCases = recentCasesRaw.map((item: any) => ({
      id: item.id,
      customer: parseFullName(item.customer?.firstName, item.customer?.lastName),
      type: item.type,
      status: resolveCaseStatus(item.status),
      agent: resolveAgentName(item.agent ?? null),
      updatedOn: formatDateTime(item.updatedAt),
    }));

    const topAgents = agents
      .map((agent: any) => {
        const assignedCases = agent.assignedCases as any[];
        const completed = assignedCases.filter((item) => item.status === 'COMPLETED' || item.status === 'APPROVED').length;
        const inProgress = assignedCases.filter((item) => item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS').length;
        const rate = assignedCases.length === 0 ? 0 : Math.round((completed / assignedCases.length) * 100);
        const completedDurations = assignedCases
          .filter((item) => (item.status === 'COMPLETED' || item.status === 'APPROVED') && item.completedAt)
          .map((item) => Math.max(1, Math.round((new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime()) / 86400000)));
        const avgTurnaround = completedDurations.length
          ? `${(completedDurations.reduce((sum: number, value: number) => sum + value, 0) / completedDurations.length).toFixed(1)} days`
          : '—';

        return {
          name: parseFullName(agent.firstName, agent.lastName),
          completed,
          inProgress,
          rate,
          avgTurnaround,
        };
      })
      .sort((a: any, b: any) => b.completed - a.completed)
      .slice(0, 5);

    const branchStats = branches.map((branch: any) => {
      const branchAgents = agents.filter((agent: any) => agent.branch === branch.name);
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
      { label: 'Total Customers', value: totalCustomersCount, trend: 12.4 },
      { label: 'Total Cases', value: totalCasesCount, trend: 10.8 },
      { label: 'Pending Cases', value: pendingCases, trend: 7.6 },
      { label: 'Completed Cases', value: completedCases, trend: 15.9 },
      { label: 'Active Agents', value: activeAgentsCount, trend: 5.4 },
      { label: 'Branches', value: branches.length, trend: 0 },
      { label: 'Rejected Cases', value: rejectedCount, trend: 0 },
      { label: 'Re-verification Cases', value: 0, trend: 0 },
    ];

    const recentActivity = logs.slice(0, 4).map((log: any) => ({
      icon: log.action.includes('Completed') ? 'success' : log.action.includes('Assigned') ? 'info' : 'activity',
      bg: log.action.includes('Completed') ? 'bg-teal-50' : log.action.includes('Assigned') ? 'bg-blue-50' : 'bg-amber-50',
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

    for (const item of pastSevenDaysCases) {
      const key = new Date((item as any).createdAt).toISOString().slice(0, 10);
      if (!dayBuckets.has(key)) continue;
      const bucket = dayBuckets.get(key)!;
      bucket.total += 1;
      if ((item as any).status === 'COMPLETED' || (item as any).status === 'APPROVED') bucket.completed += 1;
      if (['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes((item as any).status)) bucket.pending += 1;
      if ((item as any).status === 'REJECTED') bucket.rejected += 1;
    }

    const lineData = Array.from(dayBuckets.entries()).map(([key, value]) => ({
      date: new Date(`${key}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      total: value.total,
      completed: value.completed,
      pending: value.pending,
      rejected: value.rejected,
    }));

    const pieData = [
      { name: 'Pending', value: statusMap['PENDING'] || 0, color: '#B45309' },
      { name: 'In Progress', value: (statusMap['ASSIGNED'] || 0) + (statusMap['IN_PROGRESS'] || 0), color: '#1D4ED8' },
      { name: 'Completed', value: completedCases, color: '#0D9488' },
      { name: 'Rejected', value: rejectedCount, color: '#BE123C' },
    ];

    let adminPerformance: any[] = [];
    if (isSuperAdmin) {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        }
      });

      const allCases = await prisma.verificationCase.findMany({
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
        const reverification = adminCases.filter((item: any) => {
          try {
            const pd = typeof item.profileData === 'string' ? JSON.parse(item.profileData) : item.profileData;
            return pd?.adminReview?.decision === 'NEEDS_REVISION';
          } catch {
            return false;
          }
        }).length;

        return {
          id: adm.id,
          name: adm.role === 'SUPER_ADMIN' ? `${parseFullName(adm.firstName, adm.lastName)} (Super Admin)` : parseFullName(adm.firstName, adm.lastName),
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
  } catch (error: any) {
    return apiError(res, 'Failed to load dashboard data', 500, error);
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const requester = await prisma.user.findUnique({ where: { id: adminId } });
    const isSuperAdmin = requester?.role === 'SUPER_ADMIN';

    const filter = isSuperAdmin ? {} : { adminId };
    const agentFilter = isSuperAdmin ? { role: 'FIELD_AGENT', isActive: true } : { role: 'FIELD_AGENT', isActive: true, adminId };

    const [totalAgents, totalCustomers, totalBranches, casesByStatus, allCases] = await Promise.all([
      (prisma.user as any).count({ where: agentFilter }),
      (prisma.customer as any).count({ where: filter }),
      (prisma.branch as any).count(),
      (prisma.verificationCase as any).groupBy({
        by: ['status'],
        where: filter,
        _count: { status: true },
      }),
      prisma.verificationCase.findMany({
        where: filter,
        select: { profileData: true },
      }),
    ]);

    const reverificationCount = allCases.filter((item: any) => {
      try {
        const pd = typeof item.profileData === 'string' ? JSON.parse(item.profileData) : item.profileData;
        return pd?.adminReview?.decision === 'NEEDS_REVISION';
      } catch {
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
        caseBreakdown: casesByStatus.map((c: any) => ({ status: c.status, count: c._count.status })),
      },
    });
  } catch (error: any) {
    return apiError(res, 'Failed to load analytics', 500, error);
  }
};
