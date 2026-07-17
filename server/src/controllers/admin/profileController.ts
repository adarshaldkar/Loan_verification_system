import { Response } from 'express';
import bcrypt from 'bcryptjs';
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
      prisma.report.count({ where: { adminId: userId } }),
      prisma.uploadBatch.count({ where: { adminId: userId } }),
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

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { firstName, lastName, phone } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'First name and last name are required' });
    }

    if (phone) {
      const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone format (must be 10 digits)' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone: phone || null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        name: parseFullName(updatedUser.firstName, updatedUser.lastName),
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone ?? '',
      }
    });
  } catch (error: any) {
    return apiError(res, 'Failed to update profile', 500, error);
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    return apiError(res, 'Failed to update password', 500, error);
  }
};
