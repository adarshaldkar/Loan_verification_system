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

    const completed  = agent.assignedCases.filter((c) => c.status === 'COMPLETED' || c.status === 'APPROVED').length;
    const total      = agent.assignedCases.length;
    const successRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return res.status(200).json({
      success: true,
      data: {
        id: agent.id,
        name: parseFullName(agent.firstName, agent.lastName),
        firstName: agent.firstName,
        lastName: agent.lastName,
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

export const updateAgentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id;
    if (!agentId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { firstName, lastName, phone } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'First name and last name are required' });
    }

    if (phone) {
      const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone format (must be 10 digits)' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: agentId },
      data: {
        firstName,
        lastName,
        phone: phone || null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        name: parseFullName(updatedUser.firstName, updatedUser.lastName),
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone ?? '',
      }
    });
  } catch (error: any) {
    return apiError(res, 'Failed to update agent profile', 500, error);
  }
};
