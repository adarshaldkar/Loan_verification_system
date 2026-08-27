"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
async function ensureSettings() {
    const existing = await db_1.default.systemSetting.findFirst();
    if (existing)
        return existing;
    return db_1.default.systemSetting.create({
        data: {
            orgName: 'Apex Financial Services Ltd.',
            adminEmail: 'admin@lvms.com',
            slaDays: 3,
            emailOverdue: true,
            emailDigest: true,
            notifyNewUpload: false,
            notifyCaseComplete: false,
        },
    });
}
const getSettings = async (req, res) => {
    try {
        const settings = await ensureSettings();
        return res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load settings', 500, error);
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const current = await ensureSettings();
        const { orgName, adminEmail, slaDays, toggles } = req.body;
        const updated = await db_1.default.systemSetting.update({
            where: { id: current.id },
            data: {
                orgName: orgName ?? current.orgName,
                adminEmail: adminEmail ?? current.adminEmail,
                slaDays: Number.isFinite(Number(slaDays)) ? Number(slaDays) : current.slaDays,
                emailOverdue: toggles?.['Email alerts for overdue cases'] ?? current.emailOverdue,
                emailDigest: toggles?.['Email digest — daily summary'] ?? current.emailDigest,
                notifyNewUpload: toggles?.['Notify on new Excel upload'] ?? current.notifyNewUpload,
                notifyCaseComplete: toggles?.['Notify when agent completes a case'] ?? current.notifyCaseComplete,
            },
        });
        return res.status(200).json({ success: true, message: 'Settings saved successfully', data: updated });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to update settings', 500, error);
    }
};
exports.updateSettings = updateSettings;
