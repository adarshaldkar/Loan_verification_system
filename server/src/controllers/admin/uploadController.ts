import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { apiError, createAuditLog } from '../../utils/helpers';

export const bulkUploadCases = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { rows } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return apiError(res, 'No valid rows provided', 400);
    }

    let successCount = 0;

    for (const row of rows) {
      if (!row.name || !row.phone || !row.address) continue;

      const [firstName, ...lastNameParts] = row.name.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const customer = await (prisma.customer as any).create({
        data: {
          applicationId: `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          firstName,
          lastName,
          phone: String(row.phone),
          address: String(row.address),
          loanAmount: Number(row.loanAmount) || 0,
          loanType: row.loanType || 'Personal',
          adminId,
        },
      });

      await (prisma.verificationCase as any).create({
        data: {
          customerId: customer.id,
          status: 'PENDING',
          type: row.type || 'RESIDENTIAL',
          adminId,
        },
      });

      successCount++;
    }

    await createAuditLog({
      action: `Bulk uploaded ${successCount} cases from Excel`,
      actor: `Admin (${adminId})`,
      entity: 'Upload Module',
      ip: req.ip || '127.0.0.1',
      adminId,
    });

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${successCount} cases`,
      count: successCount,
    });
  } catch (error: any) {
    return apiError(res, 'Bulk upload failed', 500, error);
  }
};
