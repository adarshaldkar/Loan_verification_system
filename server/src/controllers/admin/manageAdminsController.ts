import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/db';
import { apiError } from '../../utils/helpers';

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const requesterId = (req as any).user?.id;
    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
    if (!requester || (requester.email !== 'akshaya@gmail.com' && requester.email !== 'adarshaldkar@gmail.com')) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only Super Admins can register new Admins.' });
    }

    const { email, password, firstName, lastName, phone, branch } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        branch,
        role: 'ADMIN'
      }
    });

    res.status(201).json({ success: true, message: 'Admin registered successfully', userId: user.id });
  } catch (error: any) {
    return apiError(res, 'Failed to register admin', 500, error);
  }
};

export const getAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        branch: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const formattedAdmins = admins.map(a => ({
      id: a.id,
      name: `${a.firstName} ${a.lastName}`,
      email: a.email,
      phone: a.phone || '',
      branch: a.branch || 'System',
      status: a.isActive ? 'Active' : 'Inactive',
    }));

    res.status(200).json({ success: true, data: formattedAdmins });
  } catch (error: any) {
    return apiError(res, 'Failed to load admins', 500, error);
  }
};
