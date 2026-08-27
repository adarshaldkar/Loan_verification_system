"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = exports.getReportMetrics = exports.getReports = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const getReports = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const requester = await db_1.default.user.findUnique({ where: { id: adminId } });
        const isSuperAdmin = requester && (requester.email === 'akshaya@gmail.com' || requester.email === 'adarshaldkar@gmail.com');
        const reports = await db_1.default.report.findMany({
            where: isSuperAdmin ? {} : { adminId },
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ success: true, data: reports });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load reports', 500, error);
    }
};
exports.getReports = getReports;
const getReportMetrics = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const requester = await db_1.default.user.findUnique({ where: { id: adminId } });
        const isSuperAdmin = requester && (requester.email === 'akshaya@gmail.com' || requester.email === 'adarshaldkar@gmail.com');
        const { timeframe } = req.query; // 'daily', 'weekly', 'monthly'
        let startDate = new Date();
        if (timeframe === 'weekly') {
            startDate.setDate(startDate.getDate() - 7);
        }
        else if (timeframe === 'monthly') {
            startDate.setMonth(startDate.getMonth() - 1);
        }
        else {
            // default to daily (last 24 hours)
            startDate.setDate(startDate.getDate() - 1);
        }
        const cases = await db_1.default.verificationCase.findMany({
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
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to fetch report metrics', 500, error);
    }
};
exports.getReportMetrics = getReportMetrics;
const generateReport = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { reportType, format, dateRange } = req.body;
        if (!reportType || !format) {
            return res.status(400).json({ success: false, message: 'Report type and format are required' });
        }
        const reportNames = {
            weekly: 'Weekly Verification Summary',
            agent: 'Agent Performance Report',
            branch: 'Branch Coverage Report',
            audit: 'Cases Audit Export',
        };
        const name = reportNames[reportType] ?? 'Generated Report';
        const generatedReport = await db_1.default.report.create({
            data: {
                name,
                type: format.toUpperCase() === 'PDF' ? 'PDF' : 'Excel',
                generatedBy: 'Admin',
                generatedAt: (0, helpers_1.formatDateTime)(new Date()),
                size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
                dateRange,
                format,
                adminId,
            },
        });
        return res.status(201).json({ success: true, message: 'Report generated successfully', data: generatedReport });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to generate report', 500, error);
    }
};
exports.generateReport = generateReport;
