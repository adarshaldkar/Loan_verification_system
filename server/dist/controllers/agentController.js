"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitVerification = exports.updateCaseStatus = exports.getCaseDetails = exports.getAssignedCases = void 0;
const db_1 = __importDefault(require("../config/db"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
/**
 * Fetch cases assigned to the logged-in agent
 */
const getAssignedCases = async (req, res) => {
    try {
        const agentId = req.user.id;
        const cases = await db_1.default.verificationCase.findMany({
            where: { agentId },
            include: {
                customer: true,
                media: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json({ success: true, data: cases });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
exports.getAssignedCases = getAssignedCases;
/**
 * Fetch case details for a single assigned case
 */
const getCaseDetails = async (req, res) => {
    try {
        const agentId = req.user.id;
        const caseId = req.params.id;
        const caseObj = await db_1.default.verificationCase.findFirst({
            where: { id: caseId, agentId },
            include: {
                customer: true,
                media: true,
            },
        });
        if (!caseObj) {
            return res.status(404).json({ success: false, message: "Case not found or unauthorized" });
        }
        return res.status(200).json({ success: true, data: caseObj });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
exports.getCaseDetails = getCaseDetails;
/**
 * Update case status (e.g., ASSIGNED -> TRAVELLING -> AT_LOCATION -> IN_PROGRESS)
 */
const updateCaseStatus = async (req, res) => {
    try {
        const agentId = req.user.id;
        const caseId = req.params.id;
        const { status } = req.body;
        const caseObj = await db_1.default.verificationCase.findFirst({
            where: { id: caseId, agentId },
        });
        if (!caseObj) {
            return res.status(404).json({ success: false, message: "Case not found or unauthorized" });
        }
        const updated = await db_1.default.verificationCase.update({
            where: { id: caseId },
            data: { status },
        });
        // Create Audit Log
        await db_1.default.auditLog.create({
            data: {
                actor: req.user.email || "Agent",
                action: `Updated case status to ${status}`,
                entity: `Case ${caseId}`,
                timestamp: new Date().toISOString(),
                ip: req.ip || "127.0.0.1",
            },
        });
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
exports.updateCaseStatus = updateCaseStatus;
/**
 * Submit final verification form with photo uploads, coordinates, and form data
 */
const submitVerification = async (req, res) => {
    try {
        const agentId = req.user.id;
        const caseId = req.params.id;
        const { gpsLatitude, gpsLongitude, remarks, profileData, photos, status } = req.body;
        const caseObj = await db_1.default.verificationCase.findFirst({
            where: { id: caseId, agentId },
        });
        if (!caseObj) {
            return res.status(404).json({ success: false, message: "Case not found or unauthorized" });
        }
        const uploadedMedia = [];
        // Upload base64 photos to Cloudinary
        if (photos && Array.isArray(photos)) {
            for (let i = 0; i < photos.length; i++) {
                const photoStr = photos[i];
                // Skip if not a base64 or valid string
                if (!photoStr || typeof photoStr !== "string")
                    continue;
                try {
                    const uploadResponse = await cloudinary_1.default.uploader.upload(photoStr, {
                        folder: "loan_verification_evidence",
                    });
                    // Save to media database
                    const mediaObj = await db_1.default.media.create({
                        data: {
                            url: uploadResponse.secure_url,
                            publicId: uploadResponse.public_id,
                            type: "PHOTO",
                            verificationCaseId: caseId,
                        },
                    });
                    uploadedMedia.push(mediaObj);
                }
                catch (uploadError) {
                    console.error("Cloudinary upload failed for index:", i, uploadError.message);
                }
            }
        }
        // Update case verification details
        const updatedCase = await db_1.default.verificationCase.update({
            where: { id: caseId },
            data: {
                status: status || "COMPLETED",
                gpsLatitude: gpsLatitude ? parseFloat(gpsLatitude) : null,
                gpsLongitude: gpsLongitude ? parseFloat(gpsLongitude) : null,
                remarks: remarks || null,
                profileData: profileData ? JSON.stringify(profileData) : null,
                completedAt: new Date(),
            },
            include: {
                media: true,
            },
        });
        // Create Audit Log
        await db_1.default.auditLog.create({
            data: {
                actor: req.user.email || "Agent",
                action: `Submitted verification report - Result: ${status || "COMPLETED"}`,
                entity: `Case ${caseId}`,
                timestamp: new Date().toISOString(),
                ip: req.ip || "127.0.0.1",
            },
        });
        return res.status(200).json({ success: true, message: "Verification report submitted successfully", data: updatedCase });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
exports.submitVerification = submitVerification;
