import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { parseFullName, resolveCaseStatus, formatDateTime, apiError, createAuditLog } from '../../utils/helpers';
import { geocodeAddress } from '../../utils/geocoder';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;

    const customers = await (prisma.customer as any).findMany({
      where: { adminId },
      include: {
        verificationCases: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = customers.map((customer: any) => {
      const latestCase = customer.verificationCases[0];
      return {
        id: customer.applicationId,
        name: parseFullName(customer.firstName, customer.lastName),
        phone: customer.phone ?? '',
        address: customer.address,
        loanType: customer.loanType,
        caseStatus: resolveCaseStatus(latestCase?.status ?? 'PENDING'),
        branch: customer.branch ?? latestCase?.branch ?? 'Unassigned',
        uploadDate: formatDateTime(customer.updatedAt),
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return apiError(res, 'Failed to load customers', 500, error);
  }
};

export const createCustomerAndCase = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { firstName, lastName, email, phone, address, loanAmount, businessName, type, loanType, branch,
      addressLatitude: bodyLat, addressLongitude: bodyLng, addressAccuracy: bodyAcc } = req.body;

    let addrLat: number | null = bodyLat != null ? Number(bodyLat) : null;
    let addrLng: number | null = bodyLng != null ? Number(bodyLng) : null;
    let addrAcc: string | null = bodyAcc ?? null;

    if (addrLat == null || addrLng == null) {
      try {
        const r = await geocodeAddress(String(address || '').trim());
        if (r.lat != null && r.lng != null) {
          addrLat = r.lat;
          addrLng = r.lng;
          addrAcc = r.accuracy === 'unknown' ? null : r.accuracy;
        }
      } catch {
        // non-fatal — coordinates stay null
      }
    }

    const customer = await (prisma.customer as any).create({
      data: {
        applicationId: `APP-${Date.now()}`,
        firstName,
        lastName,
        email,
        phone,
        address,
        loanAmount: Number(loanAmount),
        businessName,
        loanType: loanType || 'Home Loan',
        branch,
        adminId,
        verificationCases: {
          create: {
            type: type || 'RESIDENTIAL',
            status: 'PENDING',
            branch,
            adminId,
            addressLatitude: addrLat ?? undefined,
            addressLongitude: addrLng ?? undefined,
            addressAccuracy: addrAcc ?? undefined,
          },
        },
      },
      include: { verificationCases: true },
    });

    await createAuditLog({
      actor: `Admin (${adminId})`,
      action: 'Created customer and case',
      entity: `Customer ${parseFullName(firstName, lastName)} (${customer.applicationId})`,
      ip: req.ip || 'system',
      adminId,
    });

    return res.status(201).json({ success: true, message: 'Customer and pending case created successfully', data: customer });
  } catch (error: any) {
    return apiError(res, 'Failed to create customer', 500, error);
  }
};
