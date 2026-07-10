import { Request, Response } from 'express';
import prisma from '../../config/db';
import { apiError } from '../../utils/helpers';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ success: true, data: logs });
  } catch (error: any) {
    return apiError(res, 'Failed to load audit logs', 500, error);
  }
};
