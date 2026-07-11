import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { parseFullName, formatDateTime, apiError } from '../../utils/helpers';

export const getAgentDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id as string;

    const [agent, cases] = await Promise.all([
      prisma.user.findUnique({
        where: { id: agentId },
        select: { firstName: true, lastName: true, branch: true, email: true, phone: true },
      }),
      prisma.verificationCase.findMany({
        where: { agentId },
        include: { customer: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

    let branchCity = 'Local Area';
    if (agent.branch) {
      const branchInfo = await (prisma.branch as any).findFirst({
        where: { name: agent.branch },
      });
      if (branchInfo) {
        branchCity = branchInfo.city;
      }
    }

    const total      = cases.length;
    const pending    = cases.filter((c) => c.status === 'ASSIGNED' || c.status === 'PENDING').length;
    const inProgress = cases.filter((c) => c.status === 'IN_PROGRESS').length;
    const completed  = cases.filter((c) => c.status === 'COMPLETED').length;
    const rejected   = cases.filter((c) => c.status === 'REJECTED').length;

    // Calculate average turnaround time in minutes
    const completedDurations = cases
      .filter((c) => c.status === 'COMPLETED' && c.completedAt)
      .map((c) => Math.max(1, Math.round((new Date(c.completedAt as Date).getTime() - new Date(c.createdAt).getTime()) / 60000)));
    
    const avgTime = completedDurations.length
      ? `${Math.round(completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length)} min`
      : '—';

    const recentCases = cases.slice(0, 5).map((c) => ({
      id: c.id,
      customer: c.customer ? parseFullName(c.customer.firstName, c.customer.lastName) : 'Unknown Customer',
      phone: c.customer?.phone ?? '',
      address: c.customer?.address ?? 'No Address',
      type: c.type === 'RESIDENTIAL' ? 'Residential Verification' : 'Business Verification',
      status: c.status,
      priority: c.status === 'PENDING' ? 'High' : c.status === 'IN_PROGRESS' ? 'Medium' : 'Low',
      updatedOn: formatDateTime(c.updatedAt),
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
          name: c.customer ? parseFullName(c.customer.firstName, c.customer.lastName) : 'Unknown Customer',
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
          name: parseFullName(agent.firstName, agent.lastName),
          branch: agent.branch ?? 'Unassigned',
          branchCity,
          email: agent.email,
        },
        kpis: { total, pending, inProgress, completed, rejected, avgTime },
        recentCases,
        todaySchedule,
      },
    });
  } catch (error: any) {
    return apiError(res, 'Failed to load agent dashboard', 500, error);
  }
};
