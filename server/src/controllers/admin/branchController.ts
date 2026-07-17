import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { apiError, createAuditLog } from '../../utils/helpers';

export const getBranches = async (req: AuthRequest, res: Response) => {
  try {
    const [branches, agents, cases] = await Promise.all([
      (prisma.branch as any).findMany({ orderBy: { createdAt: 'asc' } }),
      (prisma.user as any).findMany({ where: { role: 'FIELD_AGENT' } }),
      (prisma.verificationCase as any).findMany({ include: { agent: { select: { branch: true } } } }),
    ]);

    const data = branches.map((branch: any) => {
      const branchAgents = agents.filter((a: any) => a.branch === branch.name);
      const branchCases = cases.filter((c: any) => c.branch === branch.name || (c.agent as any)?.branch === branch.name);
      return {
        id: branch.id,
        name: branch.name,
        city: branch.city,
        agents: branchAgents.length,
        activeCases: branchCases.filter((c: any) => c.status !== 'COMPLETED' && c.status !== 'REJECTED').length,
        manager: branch.manager,
        phone: branch.phone ?? '—',
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return apiError(res, 'Failed to load branches', 500, error);
  }
};

export const createBranch = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { name, city, manager, phone } = req.body;
    if (!name || !city || !manager) {
      return res.status(400).json({ success: false, message: 'Name, city and manager are required' });
    }

    const created = await (prisma.branch as any).create({ data: { name, city, manager, phone: phone || null, adminId } });

    await createAuditLog({
      actor: `Admin (${adminId})`,
      action: 'Created branch',
      entity: `Branch ${created.name}`,
      ip: req.ip || 'system',
      adminId,
    });

    return res.status(201).json({ success: true, message: 'Branch created successfully', data: created });
  } catch (error: any) {
    return apiError(res, 'Failed to create branch', 500, error);
  }
};
