import { Request, Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { parseFullName, formatDateTime, apiError } from '../../utils/helpers';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { assignedCases: true } });
    if (!user) return res.status(404).json({ success: false, message: 'Profile not found' });

    const reportsGenerated = await prisma.report.count();
    const uploadsProcessed = await prisma.uploadBatch.count();
    const activeAgents = await prisma.user.count({ where: { role: 'FIELD_AGENT', isActive: true } });

    return res.status(200).json({
      success: true,
      data: {
        name: parseFullName(user.firstName, user.lastName),
        role: user.role === 'ADMIN' ? 'System Administrator' : 'Field Agent',
        email: user.email,
        phone: user.phone ?? '',
        branch: user.branch ?? 'Unassigned',
        joined: formatDateTime(user.createdAt),
        stats: [
          { label: 'Cases Managed', value: user.assignedCases.length.toLocaleString() },
          { label: 'Agents Under You', value: activeAgents.toLocaleString() },
          { label: 'Reports Generated', value: reportsGenerated.toLocaleString() },
          { label: 'Uploads Processed', value: uploadsProcessed.toLocaleString() },
        ],
      },
    });
  } catch (error: any) {
    return apiError(res, 'Failed to load profile', 500, error);
  }
};
