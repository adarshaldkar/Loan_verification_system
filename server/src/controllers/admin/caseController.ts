import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import prisma from '../../config/db';
import { parseFullName, resolveCaseStatus, resolveAgentName, formatDateTime, apiError, createAuditLog } from '../../utils/helpers';

export const getCases = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { status } = req.query;

    const whereClause: any = { adminId };
    if (status) whereClause.status = status as string;

    const cases = await prisma.verificationCase.findMany({
      where: whereClause,
      include: {
        customer: true,
        agent: { select: { firstName: true, lastName: true, branch: true } },
        media: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = cases.map((item) => ({
      id: item.id,
      customer: parseFullName(item.customer.firstName, item.customer.lastName),
      type: item.type === 'RESIDENTIAL' ? 'Residential' : 'Business',
      status: resolveCaseStatus(item.status),
      agent: resolveAgentName(item.agent ?? null),
      branch: item.branch ?? item.agent?.branch ?? item.customer.branch ?? 'Unassigned',
      slaDue: formatDateTime(item.createdAt),
      overdue: item.status !== 'COMPLETED' && item.status !== 'REJECTED',
    }));

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return apiError(res, 'Failed to load cases', 500, error);
  }
};

export const assignCase = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const caseId = req.params.caseId as string;
    const agentId = req.body.agentId as string;

    const [existingCase, agent] = await Promise.all([
      (prisma.verificationCase as any).findFirst({
        where: { id: caseId, adminId },
        include: { customer: true }
      }),
      (prisma.user as any).findFirst({ where: { id: agentId, role: 'FIELD_AGENT', adminId } }),
    ]);

    if (!existingCase) return res.status(404).json({ success: false, message: 'Case not found' });
    if (!agent) return res.status(404).json({ success: false, message: 'Field Agent not found under your account' });

    const updatedCase = await prisma.verificationCase.update({
      where: { id: caseId },
      data: { agentId, status: 'ASSIGNED' },
      include: { customer: true }
    });

    const customerName = parseFullName(updatedCase.customer.firstName, updatedCase.customer.lastName);

    await createAuditLog({
      actor: `Admin (${adminId})`,
      action: 'Assigned case to agent',
      entity: `Customer: ${customerName} → ${parseFullName(agent.firstName, agent.lastName)}`,
      ip: req.ip || 'system',
      adminId,
    });

    return res.status(200).json({ success: true, message: `Successfully assigned case for customer ${customerName} to ${parseFullName(agent.firstName, agent.lastName)}`, data: updatedCase });
  } catch (error: any) {
    return apiError(res, 'Failed to assign case', 500, error);
  }
};

export const updateCaseStatus = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const caseId = req.params.caseId as string;
    const { status } = req.body;

    if (!['COMPLETED', 'REJECTED', 'PENDING', 'IN_PROGRESS'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    const existing = await (prisma.verificationCase as any).findFirst({ where: { id: caseId, adminId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Case not found' });

    const updatedCase = await prisma.verificationCase.update({
      where: { id: caseId },
      data: { status, completedAt: status === 'COMPLETED' ? new Date() : null },
    });

    return res.status(200).json({ success: true, message: `Case marked as ${status}`, data: updatedCase });
  } catch (error: any) {
    return apiError(res, 'Failed to update case status', 500, error);
  }
};

export const getCaseById = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const caseId = req.params.caseId as string;

    const caseData = await (prisma.verificationCase as any).findFirst({
      where: { id: caseId, adminId },
      include: {
        customer: true,
        agent: { select: { firstName: true, lastName: true, branch: true } },
        media: true,
      },
    });

    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const data = {
      id: caseData.id,
      customer: parseFullName(caseData.customer.firstName, caseData.customer.lastName),
      type: caseData.type === 'RESIDENTIAL' ? 'Residential' : 'Business',
      status: resolveCaseStatus(caseData.status),
      agent: resolveAgentName(caseData.agent ?? null),
      branch: caseData.branch ?? caseData.agent?.branch ?? caseData.customer.branch ?? 'Unassigned',
      submittedAt: caseData.completedAt ? formatDateTime(caseData.completedAt) : 'Pending',
      gps: { lat: `${caseData.gpsLatitude || '0'}° N`, lng: `${caseData.gpsLongitude || '0'}° E` },
      profileData: caseData.profileData ? JSON.parse(caseData.profileData) : null,
      remarks: caseData.remarks || 'No remarks provided.',
      media: caseData.media.map((m: any) => ({ id: m.id, url: m.url, type: m.type })),
    };

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return apiError(res, 'Failed to load case details', 500, error);
  }
};

export const assignBulkCases = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { caseIds, agentId } = req.body;

    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No cases provided' });
    }

    if (!agentId) {
      return res.status(400).json({ success: false, message: 'Agent ID is required' });
    }

    const [agent, casesToAssign] = await Promise.all([
      (prisma.user as any).findFirst({ where: { id: agentId, role: 'FIELD_AGENT', adminId } }),
      prisma.verificationCase.findMany({
        where: { id: { in: caseIds }, adminId },
        include: { customer: true }
      })
    ]);

    if (!agent) return res.status(404).json({ success: false, message: 'Field Agent not found under your account' });

    const updated = await prisma.verificationCase.updateMany({
      where: { id: { in: caseIds }, adminId },
      data: { agentId, status: 'ASSIGNED' }
    });

    const customerNames = casesToAssign.map(c => parseFullName(c.customer.firstName, c.customer.lastName)).join(', ');

    await createAuditLog({
      actor: `Admin (${adminId})`,
      action: 'Bulk assigned cases to agent',
      entity: `Customers: ${customerNames} → ${parseFullName(agent.firstName, agent.lastName)}`,
      ip: req.ip || 'system',
      adminId,
    });

    return res.status(200).json({ success: true, message: `Successfully assigned cases for ${customerNames} to ${parseFullName(agent.firstName, agent.lastName)}` });
  } catch (error: any) {
    return apiError(res, 'Failed to assign cases', 500, error);
  }
};
