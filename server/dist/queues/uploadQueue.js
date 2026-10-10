"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeBatches = void 0;
exports.enqueueUploadJob = enqueueUploadJob;
const bullmq_1 = require("bullmq");
const db_1 = __importDefault(require("../config/db"));
const helpers_1 = require("../utils/helpers");
const geocoder_1 = require("../utils/geocoder");
const redis_1 = __importDefault(require("../config/redis"));
exports.activeBatches = new Map();
/**
 * Core processing logic for an upload batch.
 * 1. Bulk parallel geocoding with concurrency pool (10x faster)
 * 2. Parallel chunked DB persistence in chunks of 15
 */
async function processUploadBatch(data, onProgress) {
    const { batchId, fileName, rows, adminId, ip } = data;
    const total = rows.length;
    const updateProgress = (processed, valid, errors, stage, status, message, caseIds = []) => {
        const state = {
            fileName,
            totalRows: total,
            processedRows: processed,
            validRows: valid,
            errorRows: errors,
            stage,
            status,
            message,
            caseIds,
        };
        exports.activeBatches.set(batchId, state);
        if (onProgress && total > 0) {
            const pct = Math.min(100, Math.round((processed / total) * 100));
            onProgress(pct, message);
        }
    };
    updateProgress(0, 0, 0, 'GEOCODING', 'PROCESSING', `Extracting and parallel geocoding ${total} addresses...`);
    // Step 1: Fast Parallel Batch Geocoding (concurrency = 10 with deduplication)
    const addresses = rows.map((r) => String(r.address || '').trim());
    let geocodeMap = new Map();
    try {
        geocodeMap = await (0, geocoder_1.batchGeocodeAddresses)(addresses, 10, (completed, uniqueCount) => {
            const pct = Math.round((completed / uniqueCount) * 45); // Geocoding takes first 45%
            updateProgress(Math.round((completed / uniqueCount) * (total / 2)), 0, 0, 'GEOCODING', 'PROCESSING', `Geocoding addresses in parallel pool (${completed}/${uniqueCount} unique locations)...`);
        });
    }
    catch (geoErr) {
        console.warn('[UploadQueue] Geocoding batch warning:', geoErr);
    }
    // Step 2: Chunked Database Ingestion (chunks of 15)
    updateProgress(Math.round(total * 0.5), 0, 0, 'SAVING', 'PROCESSING', `Creating customer profiles and verification cases...`);
    const createdCaseIds = [];
    let validCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    const CHUNK_SIZE = 15;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const chunkPromises = chunk.map(async (row) => {
            try {
                if (!row.name || !row.phone || !row.address) {
                    errorCount++;
                    processedCount++;
                    return;
                }
                const [firstName, ...lastNameParts] = String(row.name).trim().split(' ');
                const lastName = lastNameParts.join(' ') || '';
                const phone = String(row.phone).trim();
                const address = String(row.address).trim();
                // Check or create customer
                let customer = await db_1.default.customer.findFirst({
                    where: {
                        firstName: { equals: firstName, mode: 'insensitive' },
                        lastName: { equals: lastName, mode: 'insensitive' },
                        phone: phone,
                        adminId,
                    },
                });
                if (!customer) {
                    customer = await db_1.default.customer.create({
                        data: {
                            applicationId: `APP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                            firstName,
                            lastName,
                            phone: phone,
                            address: address,
                            loanAmount: Number(row.loanAmount) || 0,
                            loanType: row.loanType || 'Personal Loan',
                            adminId,
                        },
                    });
                }
                // Get coordinates from pre-fetched parallel geocode map
                const coords = geocodeMap.get(address) || { lat: null, lng: null, accuracy: 'unknown' };
                const caseType = String(row.type || 'RESIDENTIAL').toUpperCase().trim();
                const newCase = await db_1.default.verificationCase.create({
                    data: {
                        customerId: customer.id,
                        status: 'PENDING',
                        type: caseType,
                        profileData: JSON.stringify({ profileType: caseType }),
                        adminId,
                        addressLatitude: coords.lat ?? undefined,
                        addressLongitude: coords.lng ?? undefined,
                        addressAccuracy: coords.accuracy === 'unknown' ? undefined : coords.accuracy,
                    },
                });
                createdCaseIds.push(newCase.id);
                validCount++;
                processedCount++;
            }
            catch (err) {
                errorCount++;
                processedCount++;
            }
        });
        await Promise.all(chunkPromises);
        updateProgress(processedCount, validCount, errorCount, 'SAVING', 'PROCESSING', `Saved ${processedCount} of ${total} cases to database...`, createdCaseIds);
    }
    // Step 3: Finalize Batch Record & Audit Log
    try {
        await db_1.default.uploadBatch.update({
            where: { id: batchId },
            data: {
                status: 'COMPLETED',
                validRows: validCount,
                errorRows: errorCount,
            },
        });
        updateProgress(total, validCount, errorCount, 'COMPLETED', 'COMPLETED', `Import complete! Successfully created ${validCount} verification cases (${errorCount} skipped/errors).`, createdCaseIds);
        await (0, helpers_1.createAuditLog)({
            action: `Completed Bulk Excel Ingestion: ${validCount} cases created, ${errorCount} errors`,
            actor: `Admin (${adminId})`,
            entity: `Batch: ${fileName} (${batchId})`,
            ip: ip || 'system',
            adminId,
        });
    }
    catch (finalErr) {
        console.error('[UploadQueue] Finalize error:', finalErr);
    }
    return { validCount, errorCount, createdCaseIds };
}
// ── BullMQ Queue Setup with In-Process Fallback ──────────────────────────────
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let uploadQueue = null;
let uploadWorker = null;
try {
    uploadQueue = new bullmq_1.Queue('bulk-upload-queue', {
        connection: { url: redisUrl, maxRetriesPerRequest: 1 },
    });
    uploadWorker = new bullmq_1.Worker('bulk-upload-queue', async (job) => {
        return await processUploadBatch(job.data, (pct, msg) => {
            job.updateProgress(pct);
        });
    }, { connection: { url: redisUrl, maxRetriesPerRequest: 1 }, concurrency: 2 });
    uploadWorker.on('failed', (job, err) => {
        if (job?.data?.batchId) {
            const prev = exports.activeBatches.get(job.data.batchId);
            exports.activeBatches.set(job.data.batchId, {
                fileName: job.data.fileName,
                totalRows: job.data.rows.length,
                processedRows: job.data.rows.length,
                validRows: prev?.validRows || 0,
                errorRows: (prev?.errorRows || 0) + 1,
                stage: 'FAILED',
                status: 'FAILED',
                message: `Import job failed: ${err.message}`,
                caseIds: prev?.caseIds || [],
            });
        }
    });
}
catch {
    console.info('[BullMQ] Running in direct asynchronous worker mode.');
}
/**
 * Public function to enqueue an upload job.
 * Runs via BullMQ when Redis is available, or as an async background micro-task otherwise.
 */
async function enqueueUploadJob(data) {
    // Initialize batch status immediately
    exports.activeBatches.set(data.batchId, {
        fileName: data.fileName,
        totalRows: data.rows.length,
        processedRows: 0,
        validRows: 0,
        errorRows: 0,
        stage: 'GEOCODING',
        status: 'PROCESSING',
        message: 'Queued for parallel processing...',
        caseIds: [],
    });
    if (uploadQueue && !redis_1.default.isMock) {
        try {
            await uploadQueue.add('process-excel-file', data, {
                attempts: 2,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: true,
            });
            return;
        }
        catch {
            // Fallback to direct async execution
        }
    }
    // Direct Async Worker
    setImmediate(async () => {
        try {
            await processUploadBatch(data);
        }
        catch (err) {
            exports.activeBatches.set(data.batchId, {
                fileName: data.fileName,
                totalRows: data.rows.length,
                processedRows: data.rows.length,
                validRows: 0,
                errorRows: data.rows.length,
                stage: 'FAILED',
                status: 'FAILED',
                message: `Processing failed: ${err.message}`,
                caseIds: [],
            });
        }
    });
}
