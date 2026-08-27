"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadEvidence = exports.submitVerification = exports.updateAgentCaseStatus = exports.getAgentCaseById = exports.getAgentCases = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const getAgentCases = async (req, res) => {
    try {
        const agentId = req.user?.id;
        const status = req.query.status;
        const cases = await db_1.default.verificationCase.findMany({
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
            }
            catch { }
            return {
                id: c.id,
                customer: c.customer ? (0, helpers_1.parseFullName)(c.customer.firstName, c.customer.lastName) : 'Unknown Customer',
                phone: c.customer?.phone ?? '',
                address: c.customer?.address ?? 'No Address',
                type: c.type || 'RESIDENTIAL',
                loanType: c.customer?.loanType ?? 'N/A',
                loanAmount: c.customer?.loanAmount ?? 0,
                status: c.status,
                needsRevision,
                branch: c.branch ?? c.customer?.branch ?? 'Unassigned',
                assignedOn: (0, helpers_1.formatDateTime)(c.createdAt),
                mediaCount: c.media.length,
            };
        });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load cases', 500, error);
    }
};
exports.getAgentCases = getAgentCases;
const getAgentCaseById = async (req, res) => {
    try {
        const agentId = req.user?.id;
        const id = req.params.id;
        const caseData = await db_1.default.verificationCase.findFirst({
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
                assignedOn: (0, helpers_1.formatDateTime)(caseData.createdAt),
                updatedOn: (0, helpers_1.formatDateTime)(caseData.updatedAt),
                customer: {
                    name: caseData.customer ? (0, helpers_1.parseFullName)(caseData.customer.firstName, caseData.customer.lastName) : 'Unknown Customer',
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
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load case', 500, error);
    }
};
exports.getAgentCaseById = getAgentCaseById;
const updateAgentCaseStatus = async (req, res) => {
    try {
        const agentId = req.user?.id;
        const id = req.params.id;
        const { status } = req.body;
        const VALID_STATUSES = ['IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'REJECTED'];
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
        }
        const existing = await db_1.default.verificationCase.findFirst({ where: { id, agentId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Case not found or not assigned to you' });
        }
        const updated = await db_1.default.verificationCase.update({
            where: { id },
            data: {
                status,
                completedAt: status === 'COMPLETED' ? new Date() : undefined,
            },
        });
        await (0, helpers_1.createAuditLog)({
            actor: `Agent (${agentId})`,
            action: `Case status updated to ${status}`,
            entity: `Case ${id}`,
            ip: req.ip || 'system',
            adminId: req.user?.adminId,
        });
        return res.status(200).json({ success: true, message: `Case status updated to ${status}`, data: updated });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to update case status', 500, error);
    }
};
exports.updateAgentCaseStatus = updateAgentCaseStatus;
const submitVerification = async (req, res) => {
    try {
        const agentId = req.user?.id;
        const id = req.params.id;
        const { type, remarks, gpsLatitude, gpsLongitude, profileData } = req.body;
        const existing = await db_1.default.verificationCase.findFirst({ where: { id, agentId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Case not found or not assigned to you' });
        }
        const updated = await db_1.default.verificationCase.update({
            where: { id },
            data: {
                type: type ? String(type).toUpperCase() : existing.type,
                remarks,
                gpsLatitude: gpsLatitude ? Number(gpsLatitude) : undefined,
                gpsLongitude: gpsLongitude ? Number(gpsLongitude) : undefined,
                profileData: profileData ? JSON.stringify(profileData) : undefined,
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });
        await (0, helpers_1.createAuditLog)({
            actor: `Agent (${agentId})`,
            action: 'Verification submitted',
            entity: `Case ${id} — Customer: ${existing.customerId}`,
            ip: req.ip || 'system',
            adminId: req.user?.adminId,
        });
        return res.status(200).json({ success: true, message: 'Verification submitted successfully', data: updated });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to submit verification', 500, error);
    }
};
exports.submitVerification = submitVerification;
const uploadEvidence = async (req, res) => {
    try {
        const agentId = req.user?.id;
        const id = req.params.id;
        // Cloudinary URL injected by multer-storage-cloudinary
        const fileUrl = req.file?.path;
        const { type, gpsLat, gpsLng } = req.body;
        if (!fileUrl) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const existing = await db_1.default.verificationCase.findFirst({ where: { id, agentId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Case not found or not assigned to you' });
        }
        if (gpsLat || gpsLng) {
            await db_1.default.verificationCase.update({
                where: { id },
                data: {
                    gpsLatitude: gpsLat ? Number(gpsLat) : undefined,
                    gpsLongitude: gpsLng ? Number(gpsLng) : undefined,
                }
            });
        }
        const media = await db_1.default.media.create({
            data: {
                verificationCaseId: id,
                url: fileUrl,
                publicId: req.file?.filename || 'unknown',
                type: type || 'PHOTO',
            },
        });
        return res.status(201).json({ success: true, message: 'Evidence uploaded successfully', data: media });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to upload evidence', 500, error);
    }
};
exports.uploadEvidence = uploadEvidence;
