import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { parseFullName, formatDateTime, apiError } from '../../utils/helpers';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'Profile not found' });

    const [activeAgents, managedCases, reportsGenerated, uploadsProcessed] = await Promise.all([
      (prisma.user as any).count({ where: { role: 'FIELD_AGENT', isActive: true, adminId: userId } }),
      (prisma.verificationCase as any).count({ where: { adminId: userId } }),
      prisma.report.count(),
      prisma.uploadBatch.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        name: parseFullName(user.firstName, user.lastName),
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role === 'ADMIN' ? 'System Administrator' : 'Field Agent',
        email: user.email,
        phone: user.phone ?? '',
        branch: user.branch ?? 'Unassigned',
        joined: formatDateTime(user.createdAt),
        stats: [
          { label: 'Cases Managed', value: managedCases.toLocaleString() },
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
