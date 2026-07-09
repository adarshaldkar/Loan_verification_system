import { Response } from "express";
import prisma from "../config/db";
import cloudinary from "../config/cloudinary";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    branch?: string | null;
  };
}

/**
 * Fetch cases assigned to the logged-in agent
 */
export const getAssignedCases = async (req: any, res: Response) => {
  try {
    const agentId = req.user.id;
    const cases = await prisma.verificationCase.findMany({
      where: { agentId },
      include: {
        customer: true,
        media: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, data: cases });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * Fetch case details for a single assigned case
 */
export const getCaseDetails = async (req: any, res: Response) => {
  try {
    const agentId = req.user.id;
    const caseId = req.params.id;

    const caseObj = await prisma.verificationCase.findFirst({
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * Update case status (e.g., ASSIGNED -> TRAVELLING -> AT_LOCATION -> IN_PROGRESS)
 */
export const updateCaseStatus = async (req: any, res: Response) => {
  try {
    const agentId = req.user.id;
    const caseId = req.params.id;
    const { status } = req.body;

    const caseObj = await prisma.verificationCase.findFirst({
      where: { id: caseId, agentId },
    });

    if (!caseObj) {
      return res.status(404).json({ success: false, message: "Case not found or unauthorized" });
    }

    const updated = await prisma.verificationCase.update({
      where: { id: caseId },
      data: { status },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actor: req.user.email || "Agent",
        action: `Updated case status to ${status}`,
        entity: `Case ${caseId}`,
        timestamp: new Date().toISOString(),
        ip: req.ip || "127.0.0.1",
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * Submit final verification form with photo uploads, coordinates, and form data
 */
export const submitVerification = async (req: any, res: Response) => {
  try {
    const agentId = req.user.id;
    const caseId = req.params.id;
    const { gpsLatitude, gpsLongitude, remarks, profileData, photos, status } = req.body;

    const caseObj = await prisma.verificationCase.findFirst({
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
        if (!photoStr || typeof photoStr !== "string") continue;

        try {
          const uploadResponse = await cloudinary.uploader.upload(photoStr, {
            folder: "loan_verification_evidence",
          });

          // Save to media database
          const mediaObj = await prisma.media.create({
            data: {
              url: uploadResponse.secure_url,
              publicId: uploadResponse.public_id,
              type: "PHOTO",
              verificationCaseId: caseId,
            },
          });

          uploadedMedia.push(mediaObj);
        } catch (uploadError: any) {
          console.error("Cloudinary upload failed for index:", i, uploadError.message);
        }
      }
    }

    // Update case verification details
    const updatedCase = await prisma.verificationCase.update({
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
    await prisma.auditLog.create({
      data: {
        actor: req.user.email || "Agent",
        action: `Submitted verification report - Result: ${status || "COMPLETED"}`,
        entity: `Case ${caseId}`,
        timestamp: new Date().toISOString(),
        ip: req.ip || "127.0.0.1",
      },
    });

    return res.status(200).json({ success: true, message: "Verification report submitted successfully", data: updatedCase });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
