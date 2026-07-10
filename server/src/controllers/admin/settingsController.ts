import { Request, Response } from 'express';
import prisma from '../../config/db';
import { apiError } from '../../utils/helpers';

async function ensureSettings() {
  const existing = await prisma.systemSetting.findFirst();
  if (existing) return existing;

  return prisma.systemSetting.create({
    data: {
      orgName: 'Apex Financial Services Ltd.',
      adminEmail: 'admin@lvms.com',
      slaDays: 3,
      emailOverdue: true,
      emailDigest: true,
      notifyNewUpload: false,
      notifyCaseComplete: false,
    },
  });
}

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await ensureSettings();
    return res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    return apiError(res, 'Failed to load settings', 500, error);
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const current = await ensureSettings();
    const { orgName, adminEmail, slaDays, toggles } = req.body;

    const updated = await prisma.systemSetting.update({
      where: { id: current.id },
      data: {
        orgName: orgName ?? current.orgName,
        adminEmail: adminEmail ?? current.adminEmail,
        slaDays: Number.isFinite(Number(slaDays)) ? Number(slaDays) : current.slaDays,
        emailOverdue: toggles?.['Email alerts for overdue cases'] ?? current.emailOverdue,
        emailDigest: toggles?.['Email digest — daily summary'] ?? current.emailDigest,
        notifyNewUpload: toggles?.['Notify on new Excel upload'] ?? current.notifyNewUpload,
        notifyCaseComplete: toggles?.['Notify when agent completes a case'] ?? current.notifyCaseComplete,
      },
    });

    return res.status(200).json({ success: true, message: 'Settings saved successfully', data: updated });
  } catch (error: any) {
    return apiError(res, 'Failed to update settings', 500, error);
  }
};
