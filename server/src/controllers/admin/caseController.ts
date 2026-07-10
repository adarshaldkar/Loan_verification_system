import { Request, Response } from 'express';
import prisma from '../../config/db';
import { parseFullName, resolveCaseStatus, resolveAgentName, formatDateTime, apiError } from '../../utils/helpers';

export const getCases = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const cases = await prisma.verificationCase.findMany({
      where: status ? { status: status as string } : undefined,
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

export const assignCase = async (req: Request, res: Response) => {
  try {
    const caseId = req.params.caseId as string;
    const agentId = req.body.agentId as string;
    const agent = await prisma.user.findUnique({ where: { id: agentId, role: 'FIELD_AGENT' } });
    if (!agent) return res.status(404).json({ success: false, message: 'Field Agent not found' });

    const updatedCase = await prisma.verificationCase.update({
      where: { id: caseId },
      data: { agentId, status: 'ASSIGNED' },
    });

    await prisma.auditLog.create({
      data: {
        actor: 'Admin',
        action: 'Assigned case to agent',
        entity: `Case ${caseId} → ${parseFullName(agent.firstName, agent.lastName)}`,
        timestamp: new Date().toISOString(),
        ip: req.ip || 'system',
      },
    });

    return res.status(200).json({ success: true, message: 'Case assigned successfully', data: updatedCase });
  } catch (error: any) {
    return apiError(res, 'Failed to assign case', 500, error);
  }
};

export const updateCaseStatus = async (req: Request, res: Response) => {
  try {
    const caseId = req.params.caseId as string;
    const { status } = req.body;
    if (!['COMPLETED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    const updatedCase = await prisma.verificationCase.update({
      where: { id: caseId },
      data: { status, completedAt: status === 'COMPLETED' ? new Date() : null },
    });

    return res.status(200).json({ success: true, message: `Case marked as ${status}`, data: updatedCase });
  } catch (error: any) {
    return apiError(res, 'Failed to update case status', 500, error);
  }
};
