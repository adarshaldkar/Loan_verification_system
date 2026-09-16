import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { formatDateTime, apiError } from '../../utils/helpers';
import { generateRcuDocxReport } from '../../utils/rcuReportGenerator';
import { generateRcuPdfReport } from '../../utils/rcuPdfReportGenerator';
import { generateConsolidatedRcuPdf } from '../../utils/rcuBatchPdfReportGenerator';

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const requester = await prisma.user.findUnique({ where: { id: adminId } });
    const isSuperAdmin = requester?.role === 'SUPER_ADMIN';

    const reports = await prisma.report.findMany({
      where: isSuperAdmin ? {} : { adminId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: reports });
  } catch (error: any) {
    return apiError(res, 'Failed to load reports', 500, error);
  }
};

export const getReportMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const requester = await prisma.user.findUnique({ where: { id: adminId } });
    const isSuperAdmin = requester?.role === 'SUPER_ADMIN';

    const { timeframe } = req.query; // 'daily', 'weekly', 'monthly'
    let startDate = new Date();

    if (timeframe === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      // default to daily (last 24 hours)
      startDate.setDate(startDate.getDate() - 1);
    }

    const cases = await prisma.verificationCase.findMany({
      where: {
        ...(isSuperAdmin ? {} : { adminId }),
        updatedAt: {
          gte: startDate
        }
      }
    });

    const metrics = {
      completed: cases.filter(c => c.status === 'COMPLETED').length,
      inProgress: cases.filter(c => c.status === 'PENDING' || c.status === 'IN_PROGRESS').length,
      rejected: cases.filter(c => c.status === 'REJECTED').length,
      approved: cases.filter(c => c.status === 'APPROVED').length,
      total: cases.length,
    };

    return res.status(200).json({ success: true, data: metrics });
  } catch (error: any) {
    return apiError(res, 'Failed to fetch report metrics', 500, error);
  }
};

export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { reportType, format, dateRange } = req.body;
    if (!reportType || !format) {
      return res.status(400).json({ success: false, message: 'Report type and format are required' });
    }

    const reportNames: Record<string, string> = {
      weekly: 'Weekly Verification Summary',
      agent: 'Agent Performance Report',
      branch: 'Branch Coverage Report',
      audit: 'Cases Audit Export',
    };

    const name = reportNames[reportType] ?? 'Generated Report';
    const generatedReport = await prisma.report.create({
      data: {
        name,
        type: format.toUpperCase() === 'PDF' ? 'PDF' : 'Excel',
        generatedBy: 'Admin',
        generatedAt: formatDateTime(new Date()),
        size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
        dateRange,
        format,
        adminId,
      },
    });

    return res.status(201).json({ success: true, message: 'Report generated successfully', data: generatedReport });
  } catch (error: any) {
    return apiError(res, 'Failed to generate report', 500, error);
  }
};

// ─── Download Full Dynamic RCU Word Document ────────────────────────────────
export const downloadCaseRcuDocx = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const caseId = req.params.caseId as string;

    const requester = await prisma.user.findUnique({ where: { id: adminId } });
    const isSuperAdmin = requester?.role === 'SUPER_ADMIN';

    const caseData = await (prisma.verificationCase as any).findFirst({
      where: isSuperAdmin ? { id: caseId } : { id: caseId, adminId },
      include: {
        customer: true,
        agent: true,
        admin: true,
        media: true,
      },
    });

    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found or unauthorized' });
    }

    const docxBuffer = await generateRcuDocxReport(caseData);

    const safeApplicant = `${caseData.customer.firstName}_${caseData.customer.lastName}`.replace(/[^a-zA-Z0-9_]/g, '');
    const filename = `RCU_REPORT_${safeApplicant}_${caseData.customer.applicationId || caseId.slice(0, 8)}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', docxBuffer.length);

    return res.status(200).send(docxBuffer);
  } catch (error: any) {
    console.error('Error generating RCU Docx report:', error);
    return apiError(res, 'Failed to generate RCU report document', 500, error);
  }
};

// ─── Download Full Dynamic RCU PDF Document ─────────────────────────────────
export const downloadCaseRcuPdf = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const caseId = req.params.caseId as string;

    const requester = await prisma.user.findUnique({ where: { id: adminId } });
    const isSuperAdmin = requester?.role === 'SUPER_ADMIN';

    const caseData = await (prisma.verificationCase as any).findFirst({
      where: isSuperAdmin ? { id: caseId } : { id: caseId, adminId },
      include: {
        customer: true,
        agent: true,
        admin: true,
        media: true,
      },
    });

    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found or unauthorized' });
    }

    const pdfBuffer = await generateRcuPdfReport(caseData);

    const safeApplicant = `${caseData.customer.firstName}_${caseData.customer.lastName}`.replace(/[^a-zA-Z0-9_]/g, '');
    const filename = `RCU_REPORT_${safeApplicant}_${caseData.customer.applicationId || caseId.slice(0, 8)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating RCU PDF report:', error);
    return apiError(res, 'Failed to generate RCU PDF report document', 500, error);
  }
};

// ─── Export Consolidated RCU Detailed Cases PDF ─────────────────────────────
export const exportRcuBatchPdf = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { reportType, dateRange } = req.query;

    const requester = await prisma.user.findUnique({ where: { id: adminId } });
    const isSuperAdmin = requester?.role === 'SUPER_ADMIN';

    const cases = await prisma.verificationCase.findMany({
      where: isSuperAdmin ? {} : { adminId },
      include: {
        customer: true,
        agent: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 25,
    });

    const reportTitle = typeof reportType === 'string' ? reportType : 'RCU Detailed Verification Cases Summary';
    const dateRangeStr = typeof dateRange === 'string' ? dateRange : '07 Jul – 13 Jul 2026';

    const pdfBuffer = await generateConsolidatedRcuPdf(reportTitle, dateRangeStr, cases as any);

    const safeTitle = (reportTitle || 'RCU_Report').replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${safeTitle}_Detailed_Audit_${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating consolidated RCU PDF report:', error);
    return apiError(res, 'Failed to generate batch RCU PDF report', 500, error);
  }
};
