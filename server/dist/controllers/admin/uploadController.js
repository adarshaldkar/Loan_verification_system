"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadBatches = exports.getBatchStatus = exports.bulkUploadCases = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const uploadQueue_1 = require("../../queues/uploadQueue");
const metrics_1 = require("../../middlewares/metrics");
const bulkUploadCases = async (req, res) => {
    try {
        const adminId = req.user?.id;
        if (!adminId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { fileName, rows } = req.body;
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            metrics_1.excelImportRecordsTotal.labels('failed').inc();
            return (0, helpers_1.apiError)(res, 'No valid rows provided', 400);
        }
        // 1. Excel Format Validation
        const sampleRow = rows[0];
        const requiredKeys = ['name', 'phone', 'address', 'loanAmount', 'loanType', 'type'];
        const hasRequiredFormat = requiredKeys.every(k => k in sampleRow);
        if (!hasRequiredFormat) {
            metrics_1.excelImportRecordsTotal.labels('failed').inc(rows.length);
            return res.status(400).json({
                success: false,
                message: 'The uploaded file is not in the required format! Required columns: Customer Name, Phone Number, Address, Loan Amount, Loan Type, Case Type.'
            });
        }
        metrics_1.excelImportRecordsTotal.labels('success').inc(rows.length);
        // 2. Create the Upload Batch in database
        const batch = await db_1.default.uploadBatch.create({
            data: {
                fileName: fileName || 'Uploaded_Leads.xlsx',
                totalRows: rows.length,
                validRows: 0,
                errorRows: 0,
                status: 'PROCESSING',
                createdBy: req.user?.email || 'Admin',
                adminId,
            }
        });
        // 3. Enqueue Background Processing via BullMQ / Parallel Engine
        await (0, uploadQueue_1.enqueueUploadJob)({
            batchId: batch.id,
            fileName: batch.fileName,
            rows,
            adminId,
            userEmail: req.user?.email || 'Admin',
            ip: req.ip || 'system',
        });
        // 4. Instant Response (< 100ms)
        return res.status(200).json({
            success: true,
            message: 'File accepted. High-performance parallel background processing started.',
            batchId: batch.id,
            totalRows: rows.length,
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Bulk upload failed', 500, error);
    }
};
exports.bulkUploadCases = bulkUploadCases;
const getBatchStatus = async (req, res) => {
    try {
        const adminId = req.user?.id;
        if (!adminId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const batchId = req.params.batchId;
        const progress = uploadQueue_1.activeBatches.get(batchId);
        if (progress) {
            return res.status(200).json({ success: true, data: progress });
        }
        const batch = await db_1.default.uploadBatch.findFirst({
            where: { id: batchId, adminId }
        });
        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }
        return res.status(200).json({
            success: true,
            data: {
                fileName: batch.fileName,
                totalRows: batch.totalRows,
                processedRows: batch.totalRows,
                validRows: batch.validRows,
                errorRows: batch.errorRows,
                status: batch.status,
                message: batch.status === 'COMPLETED' ? 'Import complete.' : 'Import failed.',
                caseIds: [],
            }
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to fetch batch progress status', 500, error);
    }
};
exports.getBatchStatus = getBatchStatus;
const getUploadBatches = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const role = req.user?.role;
        if (!adminId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const whereClause = {};
        if (role !== 'SUPER_ADMIN') {
            whereClause.adminId = adminId;
        }
        const batches = await db_1.default.uploadBatch.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 25,
        });
        return res.status(200).json({
            success: true,
            data: batches,
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to fetch upload batches history', 500, error);
    }
};
exports.getUploadBatches = getUploadBatches;
