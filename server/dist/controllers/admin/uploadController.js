"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBatchStatus = exports.bulkUploadCases = exports.activeBatches = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
// Memory cache to store active batch progress updates
exports.activeBatches = new Map();
const bulkUploadCases = async (req, res) => {
    try {
        const adminId = req.user?.id;
        if (!adminId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { fileName, rows } = req.body;
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return (0, helpers_1.apiError)(res, 'No valid rows provided', 400);
        }
        // 1. Excel Format Validation
        const sampleRow = rows[0];
        const requiredKeys = ['name', 'phone', 'address', 'loanAmount', 'loanType', 'type'];
        const hasRequiredFormat = requiredKeys.every(k => k in sampleRow);
        if (!hasRequiredFormat) {
            return res.status(400).json({
                success: false,
                message: 'The uploaded file is not in the required format! Required columns: Customer Name, Phone Number, Address, Loan Amount, Loan Type, Case Type.'
            });
        }
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
        // 3. Initialize progress tracking
        exports.activeBatches.set(batch.id, {
            fileName: batch.fileName,
            totalRows: rows.length,
            processedRows: 0,
            validRows: 0,
            errorRows: 0,
            status: 'PROCESSING',
            message: 'Initialising background import...',
            caseIds: [],
        });
        // 4. Return success immediately
        res.status(200).json({
            success: true,
            message: 'File uploaded successfully. Background processing started.',
            batchId: batch.id,
            totalRows: rows.length,
        });
        // 5. Spawn background processor
        setImmediate(async () => {
            let processedCount = 0;
            let validCount = 0;
            let errorCount = 0;
            let createdCaseIds = [];
            for (const row of rows) {
                try {
                    if (!row.name || !row.phone || !row.address) {
                        errorCount++;
                        processedCount++;
                        continue;
                    }
                    const [firstName, ...lastNameParts] = String(row.name).trim().split(' ');
                    const lastName = lastNameParts.join(' ') || '';
                    const phone = String(row.phone).trim();
                    let customer = await db_1.default.customer.findFirst({
                        where: {
                            firstName: { equals: firstName, mode: 'insensitive' },
                            lastName: { equals: lastName, mode: 'insensitive' },
                            phone: phone,
                            adminId,
                        }
                    });
                    if (!customer) {
                        customer = await db_1.default.customer.create({
                            data: {
                                applicationId: `APP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                                firstName,
                                lastName,
                                phone: phone,
                                address: String(row.address).trim(),
                                loanAmount: Number(row.loanAmount) || 0,
                                loanType: row.loanType || 'Personal',
                                adminId,
                            }
                        });
                    }
                    const newCase = await db_1.default.verificationCase.create({
                        data: {
                            customerId: customer.id,
                            status: 'PENDING',
                            type: String(row.type).toUpperCase() === 'BUSINESS' ? 'BUSINESS' : 'RESIDENTIAL',
                            adminId,
                        }
                    });
                    createdCaseIds.push(newCase.id);
                    validCount++;
                    processedCount++;
                    exports.activeBatches.set(batch.id, {
                        fileName: batch.fileName,
                        totalRows: rows.length,
                        processedRows: processedCount,
                        validRows: validCount,
                        errorRows: errorCount,
                        status: 'PROCESSING',
                        message: `Processing row ${processedCount} of ${rows.length}...`,
                        caseIds: createdCaseIds,
                    });
                }
                catch (err) {
                    errorCount++;
                    processedCount++;
                }
            }
            try {
                await db_1.default.uploadBatch.update({
                    where: { id: batch.id },
                    data: {
                        status: 'COMPLETED',
                        validRows: validCount,
                        errorRows: errorCount,
                    }
                });
                exports.activeBatches.set(batch.id, {
                    fileName: batch.fileName,
                    totalRows: rows.length,
                    processedRows: processedCount,
                    validRows: validCount,
                    errorRows: errorCount,
                    status: 'COMPLETED',
                    message: `Import complete. Successfully imported ${validCount} cases.`,
                    caseIds: createdCaseIds,
                });
                await (0, helpers_1.createAuditLog)({
                    action: `Completed Excel import: ${validCount} valid, ${errorCount} errors`,
                    actor: `Admin (${adminId})`,
                    entity: 'Upload Module',
                    ip: '127.0.0.1',
                    adminId,
                });
            }
            catch (dbErr) {
                console.error('Failed to update upload batch status in database:', dbErr);
            }
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
        const progress = exports.activeBatches.get(batchId);
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
                caseIds: [], // We don't store caseIds in db for uploadBatch currently
            }
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to fetch batch progress status', 500, error);
    }
};
exports.getBatchStatus = getBatchStatus;
