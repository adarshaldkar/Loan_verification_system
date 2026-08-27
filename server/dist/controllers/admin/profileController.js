"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.updateProfile = exports.getProfile = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await db_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const [activeAgents, managedCases, reportsGenerated, uploadsProcessed] = await Promise.all([
            db_1.default.user.count({ where: { role: 'FIELD_AGENT', isActive: true, adminId: userId } }),
            db_1.default.verificationCase.count({ where: { adminId: userId } }),
            db_1.default.report.count({ where: { adminId: userId } }),
            db_1.default.uploadBatch.count({ where: { adminId: userId } }),
        ]);
        return res.status(200).json({
            success: true,
            data: {
                name: (0, helpers_1.parseFullName)(user.firstName, user.lastName),
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role === 'ADMIN' ? 'System Administrator' : 'Field Agent',
                email: user.email,
                phone: user.phone ?? '',
                branch: user.branch ?? 'Unassigned',
                joined: (0, helpers_1.formatDateTime)(user.createdAt),
                stats: [
                    { label: 'Cases Managed', value: managedCases.toLocaleString() },
                    { label: 'Agents Under You', value: activeAgents.toLocaleString() },
                    { label: 'Reports Generated', value: reportsGenerated.toLocaleString() },
                    { label: 'Uploads Processed', value: uploadsProcessed.toLocaleString() },
                ],
            },
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load profile', 500, error);
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { firstName, lastName, phone } = req.body;
        if (!firstName || !lastName) {
            return res.status(400).json({ success: false, message: 'First name and last name are required' });
        }
        if (phone) {
            const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ success: false, message: 'Invalid phone format (must be 10 digits)' });
            }
        }
        const updatedUser = await db_1.default.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                phone: phone || null,
            },
        });
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                name: (0, helpers_1.parseFullName)(updatedUser.firstName, updatedUser.lastName),
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                phone: updatedUser.phone ?? '',
            }
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to update profile', 500, error);
    }
};
exports.updateProfile = updateProfile;
const updatePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }
        const user = await db_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        const isValid = await bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Incorrect old password' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
        await db_1.default.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to update password', 500, error);
    }
};
exports.updatePassword = updatePassword;
