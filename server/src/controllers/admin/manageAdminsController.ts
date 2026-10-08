import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/db';
import { apiError, createAuditLog, parseFullName } from '../../utils/helpers';
import { AuthRequest } from '../../middlewares/auth';

export const registerAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const requesterId = req.user?.id;
    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
    if (!requester || requester.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden. Only Super Admins can register new Admins.' });
    }

    const { email, password, firstName, lastName, phone, branch, role = 'ADMIN' } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        branch: branch || 'System',
        role: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
      },
    });

    await createAuditLog({
      actor: `Super Admin (${requester.email})`,
      action: 'Registered new administrator',
      entity: `Admin ${parseFullName(firstName, lastName)} (${email})`,
      ip: req.ip || 'system',
      adminId: requesterId,
    });

    res.status(201).json({ success: true, message: 'Admin registered successfully', data: user });
  } catch (error: any) {
    return apiError(res, 'Failed to register admin', 500, error);
  }
};

export const getAdmins = async (req: AuthRequest, res: Response) => {
  try {
    const [admins, cases, agents] = await Promise.all([
      prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          branch: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.verificationCase.findMany({
        select: { adminId: true, customer: { select: { adminId: true } } },
      }),
      prisma.user.findMany({
        where: { role: 'FIELD_AGENT' },
        select: { adminId: true, branch: true },
      }),
    ]);

    const formattedAdmins = admins.map((a) => {
      const adminCases = cases.filter((c) => c.adminId === a.id || c.customer?.adminId === a.id).length;
      const adminAgents = agents.filter((ag) => ag.adminId === a.id || (a.branch && ag.branch === a.branch)).length;

      return {
        id: a.id,
        name: parseFullName(a.firstName, a.lastName),
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        phone: a.phone || '',
        branch: a.branch || 'System',
        role: a.role,
        status: a.isActive ? 'Active' : 'Inactive',
        totalCases: adminCases,
        totalAgents: adminAgents,
        createdAt: a.createdAt,
      };
    });

    res.status(200).json({ success: true, data: formattedAdmins });
  } catch (error: any) {
    return apiError(res, 'Failed to load admins', 500, error);
  }
};

export const updateAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const requesterId = req.user?.id;
    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
    if (!requester || requester.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden. Only Super Admins can edit Admins.' });
    }

    const adminId = req.params.adminId as string;
    const { email, password, firstName, lastName, phone, branch, isActive, role } = req.body;

    const existingAdmin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!existingAdmin || !['ADMIN', 'SUPER_ADMIN'].includes(existingAdmin.role)) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    let hashedPassword = undefined;
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const updated = await prisma.user.update({
      where: { id: adminId },
      data: {
        email: email || undefined,
        password: hashedPassword,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || null,
        branch: branch || undefined,
        role: role || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    await createAuditLog({
      actor: `Super Admin (${requester.email})`,
      action: 'Updated administrator profile',
      entity: `Admin ${parseFullName(updated.firstName, updated.lastName)} (${updated.email})`,
      ip: req.ip || 'system',
      adminId: requesterId,
    });

    res.status(200).json({ success: true, message: 'Admin updated successfully', user: updated });
  } catch (error: any) {
    return apiError(res, 'Failed to update admin', 500, error);
  }
};
