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
      take: 30,
    });

    const notifications = cases.map((c) => {
      let type: 'ASSIGNMENT' | 'APPROVED' | 'REJECTED' | 'RE_VERIFICATION' | 'INFO' = 'INFO';
      let title = '';
      let priority: 'High' | 'Medium' | 'Low' = 'Low';
      const customerName = c.customer ? parseFullName(c.customer.firstName, c.customer.lastName) : 'Unknown Customer';

      let pd: any = null;
      try {
        pd = typeof c.profileData === 'string' ? JSON.parse(c.profileData) : c.profileData;
      } catch {}

      const isRevision = pd?.adminReview?.decision === 'NEEDS_REVISION';

      if (isRevision) {
        type = 'RE_VERIFICATION';
        title = `Action Required: Re-verification for ${customerName}`;
        priority = 'High';
      } else if (c.status === 'APPROVED' || c.status === 'COMPLETED') {
        type = 'APPROVED';
        title = `Case Verified & Approved: ${customerName}`;
      } else if (c.status === 'REJECTED') {
        type = 'REJECTED';
        title = `Verification Declined: ${customerName}`;
        priority = 'High';
      } else if (c.status === 'ASSIGNED' || c.status === 'PENDING') {
        type = 'ASSIGNMENT';
        title = `New Verification Assigned: ${customerName}`;
        priority = 'High';
      } else {
        type = 'INFO';
        title = `Status Updated: ${customerName} (${resolveCaseStatus(c.status)})`;
      }

      return {
        id: c.id,
        type,
        priority,
        title,
        body: c.customer?.address || 'No address provided',
        customerName,
        phone: c.customer?.phone || '',
        loanType: c.customer?.loanType || 'Loan Verification',
        caseId: c.id,
        applicationId: c.customer?.applicationId || `APP-${c.id.slice(0, 8).toUpperCase()}`,
        status: c.status,
        time: formatDateTime(c.updatedAt),
        read: c.status === 'COMPLETED' || c.status === 'APPROVED',
      };
    });

    return res.status(200).json({ success: true, data: notifications });
  } catch (error: any) {
    return apiError(res, 'Failed to load notifications', 500, error);
  }
};

