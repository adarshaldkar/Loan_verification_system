import { Request, Response } from 'express';
import prisma from '../../config/db';
import { formatDateTime, apiError } from '../../utils/helpers';

export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ success: true, data: reports });
  } catch (error: any) {
    return apiError(res, 'Failed to load reports', 500, error);
  }
};

export const getReportMetrics = async (req: Request, res: Response) => {
  try {
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

export const generateReport = async (req: Request, res: Response) => {
  try {
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
      },
    });

    return res.status(201).json({ success: true, message: 'Report generated successfully', data: generatedReport });
  } catch (error: any) {
    return apiError(res, 'Failed to generate report', 500, error);
  }
};
