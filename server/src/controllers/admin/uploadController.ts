import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { apiError } from '../../utils/helpers';
import { enqueueUploadJob, activeBatches } from '../../queues/uploadQueue';

export const bulkUploadCases = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { fileName, rows } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return apiError(res, 'No valid rows provided', 400);
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
    const batch = await prisma.uploadBatch.create({
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
    await enqueueUploadJob({
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
  } catch (error: any) {
    return apiError(res, 'Bulk upload failed', 500, error);
  }
};

export const getBatchStatus = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const batchId = req.params.batchId as string;

    const progress = activeBatches.get(batchId);
    if (progress) {
      return res.status(200).json({ success: true, data: progress });
    }

    const batch = await prisma.uploadBatch.findFirst({
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
  } catch (error: any) {
    return apiError(res, 'Failed to fetch batch progress status', 500, error);
  }
};
