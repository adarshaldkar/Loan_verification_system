import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { apiError } from '../../utils/helpers';

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const logs = await (prisma.auditLog as any).findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: logs });
  } catch (error: any) {
    return apiError(res, 'Failed to load audit logs', 500, error);
  }
};
