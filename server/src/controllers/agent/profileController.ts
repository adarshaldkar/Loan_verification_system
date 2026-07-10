import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { parseFullName, formatDateTime, apiError } from '../../utils/helpers';

export const getAgentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id as string;

    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      include: { assignedCases: true },
    });
    if (!agent) return res.status(404).json({ success: false, message: 'Profile not found' });

    const completed  = agent.assignedCases.filter((c) => c.status === 'COMPLETED').length;
    const total      = agent.assignedCases.length;
    const successRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return res.status(200).json({
      success: true,
      data: {
        id: agent.id,
        name: parseFullName(agent.firstName, agent.lastName),
        email: agent.email,
        phone: agent.phone ?? '',
        branch: agent.branch ?? 'Unassigned',
        joined: formatDateTime(agent.createdAt),
        stats: {
          total,
          completed,
          pending: agent.assignedCases.filter((c) => c.status === 'ASSIGNED' || c.status === 'PENDING').length,
          successRate,
        },
      },
    });
  } catch (error: any) {
    return apiError(res, 'Failed to load profile', 500, error);
  }
};
