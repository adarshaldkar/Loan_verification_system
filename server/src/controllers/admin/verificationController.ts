import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import prisma from '../../config/db';
import { parseFullName, resolveCaseStatus, resolveAgentName, formatDateTime, apiError, createAuditLog } from '../../utils/helpers';

// GET /admin/verification — all completed cases awaiting admin review
export const getCompletedCases = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;

    const cases = await prisma.verificationCase.findMany({
      where: {
        adminId,
        status: 'COMPLETED',
      },
      include: {
        customer: true,
        agent: { select: { id: true, firstName: true, lastName: true, branch: true, email: true } },
        media: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    const data = cases.map((item) => ({
      id: item.id,
      customer: parseFullName(item.customer.firstName, item.customer.lastName),
      applicationId: item.customer.applicationId,
      type: item.type === 'RESIDENTIAL' ? 'Residential' : 'Business',
      status: item.status,
      agent: resolveAgentName(item.agent ?? null),
      agentId: item.agentId,
      agentEmail: item.agent?.email ?? null,
      branch: item.branch ?? item.agent?.branch ?? item.customer.branch ?? 'Unassigned',
      submittedAt: item.completedAt ? formatDateTime(item.completedAt) : 'Pending',
      loanAmount: item.customer.loanAmount,
      loanType: item.customer.loanType,
      address: item.customer.address,
      mediaCount: item.media.length,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return apiError(res, 'Failed to load completed cases', 500, error);
  }
};

// GET /admin/verification/:caseId — full case detail with all documents
export const getVerificationDetail = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const caseId = req.params.caseId;

    const caseData = await (prisma.verificationCase as any).findFirst({
      where: { id: caseId, adminId },
      include: {
        customer: true,
        agent: { select: { id: true, firstName: true, lastName: true, branch: true, email: true, phone: true } },
        media: true,
      },
    });

    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    let profileData = null;
    try {
      profileData = caseData.profileData ? JSON.parse(caseData.profileData) : null;
    } catch {
      profileData = null;
    }

    const data = {
      id: caseData.id,
      customer: {
        name: parseFullName(caseData.customer.firstName, caseData.customer.lastName),
        applicationId: caseData.customer.applicationId,
        email: caseData.customer.email,
        phone: caseData.customer.phone,
        address: caseData.customer.address,
        loanAmount: caseData.customer.loanAmount,
        loanType: caseData.customer.loanType,
        businessName: caseData.customer.businessName,
      },
      type: caseData.type === 'RESIDENTIAL' ? 'Residential' : 'Business',
      status: caseData.status,
      agent: {
        name: resolveAgentName(caseData.agent ?? null),
        id: caseData.agent?.id ?? null,
        email: caseData.agent?.email ?? null,
        phone: caseData.agent?.phone ?? null,
        branch: caseData.agent?.branch ?? 'N/A',
      },
      branch: caseData.branch ?? caseData.agent?.branch ?? caseData.customer.branch ?? 'Unassigned',
      submittedAt: caseData.completedAt ? formatDateTime(caseData.completedAt) : 'Pending',
      createdAt: formatDateTime(caseData.createdAt),
      // Geo-tag data
      geoTag: {
        latitude: caseData.gpsLatitude,
        longitude: caseData.gpsLongitude,
        hasLocation: !!(caseData.gpsLatitude && caseData.gpsLongitude),
      },
      // Agent remarks
      remarks: caseData.remarks || 'No remarks provided.',
      // Residential / Business form data
      profileData,
      // Media evidence (photos)
      media: caseData.media.map((m: any) => ({
        id: m.id,
        url: m.url,
        publicId: m.publicId,
        type: m.type,
        createdAt: formatDateTime(m.createdAt),
      })),
    };

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return apiError(res, 'Failed to load verification detail', 500, error);
  }
};

// POST /admin/verification/:caseId/review — approve or reject a completed case
export const reviewCase = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const caseId = req.params.caseId;
    const { decision, adminRemarks } = req.body; // decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'

    if (!['APPROVED', 'REJECTED', 'NEEDS_REVISION'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid decision. Must be APPROVED, REJECTED, or NEEDS_REVISION.' });
    }

    const existingCase = await (prisma.verificationCase as any).findFirst({
      where: { id: caseId, adminId },
      include: {
        agent: { select: { id: true, firstName: true, lastName: true } },
        customer: { select: { firstName: true, lastName: true, applicationId: true } },
      },
    });

    if (!existingCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // Map decision to status
    const newStatus = decision === 'APPROVED' ? 'APPROVED' : decision === 'REJECTED' ? 'REJECTED' : 'IN_PROGRESS';

    // Merge adminRemarks into profileData
    let profileData = existingCase.profileData ? JSON.parse(existingCase.profileData) : {};
    profileData.adminReview = {
      decision,
      adminRemarks: adminRemarks || '',
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminId,
    };

    await prisma.verificationCase.update({
      where: { id: caseId },
      data: {
        status: newStatus,
        profileData: JSON.stringify(profileData),
        completedAt: decision === 'APPROVED' ? new Date() : existingCase.completedAt,
      },
    });

    // Create audit log
    await createAuditLog({
      actor: `Admin (${adminId})`,
      action: `Case ${decision.toLowerCase()}`,
      entity: `Case ${caseId} — ${parseFullName(existingCase.customer.firstName, existingCase.customer.lastName)} (${existingCase.customer.applicationId})`,
      ip: req.ip || 'system',
      adminId,
    });

    const decisionLabel = decision === 'APPROVED' ? 'Approved ✅' : decision === 'REJECTED' ? 'Rejected ❌' : 'Sent for Revision 🔄';

    return res.status(200).json({
      success: true,
      message: `Case ${decisionLabel} successfully. Agent has been notified.`,
      data: {
        caseId,
        decision,
        newStatus,
        agentId: existingCase.agentId,
        agentName: resolveAgentName(existingCase.agent),
      },
    });
  } catch (error: any) {
    return apiError(res, 'Failed to review case', 500, error);
  }
};
