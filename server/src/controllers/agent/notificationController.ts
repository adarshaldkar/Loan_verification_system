import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { parseFullName, resolveCaseStatus, formatDateTime, apiError } from '../../utils/helpers';

export const getAgentNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id as string;

    const cases = await prisma.verificationCase.findMany({
      where: { agentId },
      include: { customer: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    const notifications = cases.map((c) => ({
      id: c.id,
      type: c.status === 'ASSIGNED' ? 'new_case' : 'status_update',
      title: c.status === 'ASSIGNED'
        ? `New case assigned: ${parseFullName(c.customer.firstName, c.customer.lastName)}`
        : `Case updated to ${resolveCaseStatus(c.status)}`,
      body: c.customer.address,
      caseId: c.id,
      time: formatDateTime(c.updatedAt),
      read: c.status !== 'ASSIGNED',
    }));

    return res.status(200).json({ success: true, data: notifications });
  } catch (error: any) {
    return apiError(res, 'Failed to load notifications', 500, error);
  }
};
