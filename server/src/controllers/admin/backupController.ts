import { Request, Response } from 'express';
import { executeBackupPipeline, getBackupStatus } from '../../services/backupService';
import { logger } from '../../observability/logger';

export async function triggerManualBackup(req: Request, res: Response) {
  try {
    logger.info({ user: (req as any).user?.email }, 'Admin triggered manual backup pipeline');
    // Execute async or wait
    const result = await executeBackupPipeline();
    res.status(200).json({
      success: result.lastStatus === 'SUCCESS',
      message: result.lastStatus === 'SUCCESS' ? 'Backup completed successfully!' : 'Backup failed.',
      details: result,
    });
  } catch (err: any) {
    logger.error({ err }, 'Error triggering manual backup');
    res.status(500).json({ success: false, message: 'Internal backup error', error: err.message });
  }
}

export function getStatus(req: Request, res: Response) {
  const currentStatus = getBackupStatus();
  res.status(200).json({
    success: true,
    status: currentStatus,
  });
}
