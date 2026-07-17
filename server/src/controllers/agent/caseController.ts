import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { parseFullName, formatDateTime, apiError, createAuditLog } from '../../utils/helpers';

export const getAgentCases = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id as string;
    const status = req.query.status as string | undefined;

    const cases = await prisma.verificationCase.findMany({
      where: {
        agentId,
        ...(status && status !== 'All' ? { status } : {}),
      },
      include: { customer: true, media: true },
      orderBy: { updatedAt: 'desc' },
    });

    const data = cases.map((c) => {
      let needsRevision = false;
      try {
        const pd = typeof c.profileData === 'string' ? JSON.parse(c.profileData) : c.profileData;
        needsRevision = pd?.adminReview?.decision === 'NEEDS_REVISION';
      } catch {}

      return {
        id: c.id,
        customer: c.customer ? parseFullName(c.customer.firstName, c.customer.lastName) : 'Unknown Customer',
        phone: c.customer?.phone ?? '',
        address: c.customer?.address ?? 'No Address',
        type: c.type === 'RESIDENTIAL' ? 'RESIDENTIAL' : 'BUSINESS',
        loanType: c.customer?.loanType ?? 'N/A',
        loanAmount: c.customer?.loanAmount ?? 0,
        status: c.status,
        needsRevision,
        branch: c.branch ?? c.customer?.branch ?? 'Unassigned',
        assignedOn: formatDateTime(c.createdAt),
        mediaCount: c.media.length,
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return apiError(res, 'Failed to load cases', 500, error);
  }
};

export const getAgentCaseById = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id as string;
    const id = req.params.id as string;

    const caseData = await prisma.verificationCase.findFirst({
      where: { id, agentId },
      include: { customer: true, media: true },
    });

    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found or not assigned to you' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: caseData.id,
        status: caseData.status,
        type: caseData.type,
        branch: caseData.branch,
        remarks: caseData.remarks,
        gpsLatitude: caseData.gpsLatitude,
        gpsLongitude: caseData.gpsLongitude,
        profileData: caseData.profileData,
        assignedOn: formatDateTime(caseData.createdAt),
        updatedOn: formatDateTime(caseData.updatedAt),
        customer: {
          name: caseData.customer ? parseFullName(caseData.customer.firstName, caseData.customer.lastName) : 'Unknown Customer',
          phone: caseData.customer?.phone ?? '',
          email: caseData.customer?.email ?? '',
          address: caseData.customer?.address ?? 'No Address',
          loanType: caseData.customer?.loanType ?? 'N/A',
          loanAmount: caseData.customer?.loanAmount ?? 0,
          businessName: caseData.customer?.businessName ?? '',
        },
        media: caseData.media.map((m) => ({ id: m.id, url: m.url, type: m.type })),
      },
    });
  } catch (error: any) {
    return apiError(res, 'Failed to load case', 500, error);
  }
};

export const updateAgentCaseStatus = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id as string;
    const id = req.params.id as string;
    const { status } = req.body;

    const VALID_STATUSES = ['IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'REJECTED'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const existing = await prisma.verificationCase.findFirst({ where: { id, agentId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Case not found or not assigned to you' });
    }

    const updated = await prisma.verificationCase.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    await createAuditLog({
      actor: `Agent (${agentId})`,
      action: `Case status updated to ${status}`,
      entity: `Case ${id}`,
      ip: req.ip || 'system',
      adminId: req.user?.adminId,
    });

    return res.status(200).json({ success: true, message: `Case status updated to ${status}`, data: updated });
  } catch (error: any) {
    return apiError(res, 'Failed to update case status', 500, error);
  }
};

export const submitVerification = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id as string;
    const id = req.params.id as string;
    const { remarks, gpsLatitude, gpsLongitude, profileData } = req.body;

    const existing = await prisma.verificationCase.findFirst({ where: { id, agentId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Case not found or not assigned to you' });
    }

    const updated = await prisma.verificationCase.update({
      where: { id },
      data: {
        remarks,
        gpsLatitude: gpsLatitude ? Number(gpsLatitude) : undefined,
        gpsLongitude: gpsLongitude ? Number(gpsLongitude) : undefined,
        profileData: profileData ? JSON.stringify(profileData) : undefined,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    await createAuditLog({
      actor: `Agent (${agentId})`,
      action: 'Verification submitted',
      entity: `Case ${id} — Customer: ${existing.customerId}`,
      ip: req.ip || 'system',
      adminId: req.user?.adminId,
    });

    return res.status(200).json({ success: true, message: 'Verification submitted successfully', data: updated });
  } catch (error: any) {
    return apiError(res, 'Failed to submit verification', 500, error);
  }
};

export const uploadEvidence = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id as string;
    const id = req.params.id as string;
    
    // Cloudinary URL injected by multer-storage-cloudinary
    const fileUrl = req.file?.path;
    const { type, gpsLat, gpsLng } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const existing = await prisma.verificationCase.findFirst({ where: { id, agentId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Case not found or not assigned to you' });
    }

    if (gpsLat || gpsLng) {
      await prisma.verificationCase.update({
        where: { id },
        data: {
          gpsLatitude: gpsLat ? Number(gpsLat) : undefined,
          gpsLongitude: gpsLng ? Number(gpsLng) : undefined,
        }
      });
    }

    const media = await prisma.media.create({
      data: {
        verificationCaseId: id,
        url: fileUrl,
        publicId: (req.file as any)?.filename || 'unknown',
        type: type || 'PHOTO',
      },
    });

    return res.status(201).json({ success: true, message: 'Evidence uploaded successfully', data: media });
  } catch (error: any) {
    return apiError(res, 'Failed to upload evidence', 500, error);
  }
};
