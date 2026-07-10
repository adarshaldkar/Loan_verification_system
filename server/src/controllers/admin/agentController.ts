import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { parseFullName, apiError } from '../../utils/helpers';

export const getAgents = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;

    const agents = await (prisma.user as any).findMany({
      where: { role: 'FIELD_AGENT', adminId },
      include: { assignedCases: true },
      orderBy: { createdAt: 'asc' },
    });

    const data = agents.map((agent: any) => {
      const assignedCases: any[] = agent.assignedCases;
      const completedCases = assignedCases.filter((item) => item.status === 'COMPLETED').length;
      const activeCases = assignedCases.filter((item) => item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS').length;
      const rejectedCases = assignedCases.filter((item) => item.status === 'REJECTED').length;
      const totalResolved = completedCases + rejectedCases;
      const successRate = totalResolved === 0 ? 0 : Math.round((completedCases / totalResolved) * 100);
      const completedDurations = assignedCases
        .filter((item) => item.status === 'COMPLETED' && item.completedAt)
        .map((item) => Math.max(1, Math.round((new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime()) / 86400000)));
      const avgTurnaround = completedDurations.length
        ? `${(completedDurations.reduce((sum: number, value: number) => sum + value, 0) / completedDurations.length).toFixed(1)} days`
        : '—';

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

export const toggleAgentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const agentId = req.params.agentId as string;

    const agent = await (prisma.user as any).findFirst({ where: { id: agentId, adminId } });
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
