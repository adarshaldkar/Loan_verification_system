import { Request, Response } from 'express';
import prisma from '../../config/db';
import { parseFullName, resolveCaseStatus, formatDateTime, apiError } from '../../utils/helpers';

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        verificationCases: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = customers.map((customer) => {
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

export const createCustomerAndCase = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, address, loanAmount, businessName, type, loanType, branch } = req.body;

    const customer = await prisma.customer.create({
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
        verificationCases: {
          create: {
            type: type || 'RESIDENTIAL',
            status: 'PENDING',
            branch,
          },
        },
      },
      include: { verificationCases: true },
    });

    await prisma.auditLog.create({
      data: {
        actor: 'Admin',
        action: 'Created customer and case',
        entity: `Customer ${parseFullName(firstName, lastName)} (${customer.applicationId})`,
        timestamp: new Date().toISOString(),
        ip: req.ip || 'system',
      },
    });

    return res.status(201).json({ success: true, message: 'Customer and pending case created successfully', data: customer });
  } catch (error: any) {
    return apiError(res, 'Failed to create customer', 500, error);
  }
};
