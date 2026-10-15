"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerManualBackup = triggerManualBackup;
exports.getStatus = getStatus;
const backupService_1 = require("../../services/backupService");
const logger_1 = require("../../observability/logger");
async function triggerManualBackup(req, res) {
    try {
        logger_1.logger.info({ user: req.user?.email }, 'Admin triggered manual backup pipeline');
        // Execute async or wait
        const result = await (0, backupService_1.executeBackupPipeline)();
        res.status(200).json({
            success: result.lastStatus === 'SUCCESS',
            message: result.lastStatus === 'SUCCESS' ? 'Backup completed successfully!' : 'Backup failed.',
            details: result,
        });
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Error triggering manual backup');
        res.status(500).json({ success: false, message: 'Internal backup error', error: err.message });
    }
}
function getStatus(req, res) {
    const currentStatus = (0, backupService_1.getBackupStatus)();
    res.status(200).json({
        success: true,
        status: currentStatus,
    });
}
