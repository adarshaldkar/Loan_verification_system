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

    const total      = cases.length;
    const pending    = cases.filter((c) => c.status === 'ASSIGNED' || c.status === 'PENDING').length;
    const inProgress = cases.filter((c) => c.status === 'IN_PROGRESS').length;
    const completed  = cases.filter((c) => c.status === 'COMPLETED').length;
    const rejected   = cases.filter((c) => c.status === 'REJECTED').length;

    const recentCases = cases.slice(0, 5).map((c) => ({
      id: c.id,
      customer: parseFullName(c.customer.firstName, c.customer.lastName),
      address: c.customer.address,
      type: c.type === 'RESIDENTIAL' ? 'Residential Verification' : 'Business Verification',
      status: c.status,
      priority: c.status === 'PENDING' ? 'High' : c.status === 'IN_PROGRESS' ? 'Medium' : 'Low',
      updatedOn: formatDateTime(c.updatedAt),
    }));

    return res.status(200).json({
      success: true,
      data: {
        agent: {
          name: parseFullName(agent.firstName, agent.lastName),
          branch: agent.branch ?? 'Unassigned',
          email: agent.email,
        },
        kpis: { total, pending, inProgress, completed, rejected },
        recentCases,
      },
    });
  } catch (error: any) {
    return apiError(res, 'Failed to load agent dashboard', 500, error);
  }
};
