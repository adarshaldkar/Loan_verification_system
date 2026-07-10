import { Request, Response } from 'express';
import prisma from '../../config/db';
import { apiError } from '../../utils/helpers';

export const getBranches = async (req: Request, res: Response) => {
  try {
    const [branches, agents, cases] = await Promise.all([
      prisma.branch.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.user.findMany({ where: { role: 'FIELD_AGENT' } }),
      prisma.verificationCase.findMany({ include: { agent: { select: { branch: true } } } }),
    ]);

    const data = branches.map((branch) => {
      const branchAgents = agents.filter((a) => a.branch === branch.name);
      const branchCases = cases.filter((c) => c.branch === branch.name || c.agent?.branch === branch.name);
      return {
        id: branch.id,
        name: branch.name,
        city: branch.city,
        agents: branchAgents.length,
        activeCases: branchCases.filter((c) => c.status !== 'COMPLETED' && c.status !== 'REJECTED').length,
        manager: branch.manager,
        phone: branch.phone ?? '—',
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return apiError(res, 'Failed to load branches', 500, error);
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name, city, manager, phone } = req.body;
    if (!name || !city || !manager) {
      return res.status(400).json({ success: false, message: 'Name, city and manager are required' });
    }

    const created = await prisma.branch.create({ data: { name, city, manager, phone: phone || null } });

    await prisma.auditLog.create({
      data: {
        actor: 'Admin',
        action: 'Created branch',
        entity: `Branch ${created.name}`,
        timestamp: new Date().toISOString(),
        ip: req.ip || 'system',
      },
    });

    return res.status(201).json({ success: true, message: 'Branch created successfully', data: created });
  } catch (error: any) {
    return apiError(res, 'Failed to create branch', 500, error);
  }
};
