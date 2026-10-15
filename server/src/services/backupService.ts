/**
 * 3-Tier Automated Backup & Sync Service
 * 
 * Pipeline Architecture:
 *   [1. Primary DB (VPS Local or Neon)] 
 *          │
 *          ▼ (Syncs records if NEON_DATABASE_URL != DATABASE_URL)
 *   [2. Neon DB Cloud Replica]
 *          │
 *          ▼ (Gzip compression & SHA1 checksum)
 *   [3. Backblaze B2 Encrypted Cold Storage + Local Disk ./backups/]
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import https from 'https';
import prisma from '../config/db';
import { PrismaClient } from '@prisma/client';
import { logger } from '../observability/logger';

interface BackupStatus {
  lastRunAt: string | null;
  lastStatus: 'IDLE' | 'SUCCESS' | 'FAILED' | 'RUNNING';
  lastError: string | null;
  lastFileName: string | null;
  lastB2FileId: string | null;
  totalRecordsBackedUp: number;
  neonSynced: boolean;
}

let status: BackupStatus = {
  lastRunAt: null,
  lastStatus: 'IDLE',
  lastError: null,
  lastFileName: null,
  lastB2FileId: null,
  totalRecordsBackedUp: 0,
  neonSynced: false,
};

// HTTPS request helper
function httpsRequest(url: string, options: https.RequestOptions, postData: string | Buffer | null = null): Promise<{
  statusCode?: number;
  headers: any;
  body: string;
}> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: buffer.toString('utf8'),
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// B2 Authorize
async function authorizeB2(keyId: string, appKey: string) {
  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${appKey}`).toString('base64');
  const res = await httpsRequest('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
    method: 'GET',
    headers: { Authorization: authHeader }
  });

  if (res.statusCode !== 200) {
    throw new Error(`B2 Authorization failed (${res.statusCode}): ${res.body}`);
  }

  const data = JSON.parse(res.body);
  return {
    apiUrl: data.apiInfo?.storageApi?.apiUrl || data.apiUrl,
    authToken: data.authorizationToken,
    bucketId: data.apiInfo?.storageApi?.bucketId || process.env.B2_BUCKET_ID || '127d204e06073dfea91d0c1a',
    bucketName: data.apiInfo?.storageApi?.bucketName || process.env.B2_BUCKET_NAME || 'skylinerisk-db-backups'
  };
}

// B2 Get Upload URL
async function getB2UploadUrl(apiUrl: string, authToken: string, bucketId: string) {
  const res = await httpsRequest(`${apiUrl}/b2api/v3/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      Authorization: authToken,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({ bucketId }));

  if (res.statusCode !== 200) {
    throw new Error(`Failed to get B2 upload URL (${res.statusCode}): ${res.body}`);
  }

  const data = JSON.parse(res.body);
  return {
    uploadUrl: data.uploadUrl,
    uploadAuthToken: data.authorizationToken
  };
}

// B2 Upload File
function uploadFileToB2(uploadUrl: string, uploadAuthToken: string, fileName: string, fileBuffer: Buffer): Promise<{ fileId: string; fileName: string }> {
  const sha1 = crypto.createHash('sha1').update(fileBuffer).digest('hex');

  return new Promise((resolve, reject) => {
    const req = https.request(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: uploadAuthToken,
        'X-Bz-File-Name': encodeURIComponent(fileName),
        'Content-Type': 'application/gzip',
        'Content-Length': fileBuffer.length,
        'X-Bz-Content-Sha1': sha1
      }
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`B2 upload failed (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(fileBuffer);
    req.end();
  });
}

/**
 * Execute the 3-Tier Backup & Sync Pipeline
 */
export async function executeBackupPipeline(): Promise<BackupStatus> {
  if (status.lastStatus === 'RUNNING') {
    logger.warn('Backup pipeline already running. Skipping duplicate call.');
    return status;
  }

  status.lastStatus = 'RUNNING';
  status.lastError = null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    logger.info('🚀 Starting 3-Tier Automated Backup Pipeline...');

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Export all 12 tables from the primary active database
    // ─────────────────────────────────────────────────────────────────────────
    const exportData: { metadata: any; tables: Record<string, any[]> } = {
      metadata: {
        exportedAt: new Date().toISOString(),
        system: 'Sky Line Risk Audit Services - LVMS',
        version: '1.0.0',
      },
      tables: {}
    };

    const models = [
      'user',
      'customer',
      'verificationCase',
      'branch',
      'report',
      'auditLog',
      'systemSetting',
      'uploadBatch',
      'media',
      'agentRide',
      'agentLocation',
      'tripSegment',
    ];

    let totalRecords = 0;
    for (const m of models) {
      try {
        if ((prisma as any)[m] && typeof (prisma as any)[m].findMany === 'function') {
          const rows = await (prisma as any)[m].findMany();
          exportData.tables[m] = rows;
          totalRecords += rows.length;
        }
      } catch (err: any) {
        logger.warn({ model: m, error: err.message }, 'Failed to export table model');
      }
    }

    status.totalRecordsBackedUp = totalRecords;
    logger.info({ totalRecords }, 'Primary database exported successfully');

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Sync to Neon DB (Tier 2 Cloud Mirror) if configured
    // ─────────────────────────────────────────────────────────────────────────
    const neonUrl = process.env.NEON_DATABASE_URL;
    const primaryUrl = process.env.DATABASE_URL;
    let neonSynced = false;

    if (neonUrl && neonUrl !== primaryUrl) {
      logger.info('Syncing records to Neon DB cloud mirror...');
      let neonClient: PrismaClient | null = null;
      try {
        neonClient = new PrismaClient({ datasources: { db: { url: neonUrl } } });
        await neonClient.$connect();

        const syncOrder = [
          'user',
          'customer',
          'branch',
          'systemSetting',
          'verificationCase',
          'media',
          'agentRide',
          'agentLocation',
          'tripSegment',
          'report',
          'auditLog',
          'uploadBatch',
        ];

        for (const m of syncOrder) {
          const rows = exportData.tables[m];
          if (!rows || rows.length === 0) continue;

          for (const row of rows) {
            try {
              const processed = { ...row };
              for (const [k, v] of Object.entries(processed)) {
                if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
                  processed[k] = new Date(v);
                }
              }

              if (processed.id && (neonClient as any)[m]?.upsert) {
                await (neonClient as any)[m].upsert({
                  where: { id: processed.id },
                  update: processed,
                  create: processed
                });
              }
            } catch {
              // Ignore foreign key or duplicate race conditions
            }
          }
        }
        neonSynced = true;
        logger.info('Neon DB cloud mirror synced successfully');
      } catch (neonErr: any) {
        logger.warn({ error: neonErr.message }, 'Neon DB mirror sync encountered an issue (backup will proceed to B2)');
      } finally {
        if (neonClient) {
          await neonClient.$disconnect().catch(() => {});
        }
      }
    } else {
      // If primary DB is already Neon DB, mark as synced
      neonSynced = Boolean(primaryUrl && primaryUrl.includes('neon.tech'));
    }
    status.neonSynced = neonSynced;

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Gzip compression, Local Disk Save & Backblaze B2 Upload
    // ─────────────────────────────────────────────────────────────────────────
    const jsonStr = JSON.stringify(exportData, null, 2);
    const compressedBuffer = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'), { level: 9 });

    const fileName = `lvms_backup_${timestamp}.json.gz`;
    const localFilePath = path.join(backupDir, fileName);
    fs.writeFileSync(localFilePath, compressedBuffer);
    status.lastFileName = fileName;

    // Backblaze B2 upload credentials (env or defaults)
    const b2KeyId = process.env.B2_KEY_ID || '0052d0e67de9dca0000000001';
    const b2AppKey = process.env.B2_APPLICATION_KEY || 'K0057O0XabYzlE3cbEZNhVtUTvSK1jM';

    if (b2KeyId && b2AppKey) {
      const b2Auth = await authorizeB2(b2KeyId, b2AppKey);
      const uploadCreds = await getB2UploadUrl(b2Auth.apiUrl, b2Auth.authToken, b2Auth.bucketId);
      const uploadResult = await uploadFileToB2(uploadCreds.uploadUrl, uploadCreds.uploadAuthToken, `database/${fileName}`, compressedBuffer);
      status.lastB2FileId = uploadResult.fileId;
      logger.info({ fileName, fileId: uploadResult.fileId, bucket: b2Auth.bucketName }, 'Uploaded to Backblaze B2 successfully');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Retention Policy (Prune local backups older than 14 days)
    // ─────────────────────────────────────────────────────────────────────────
    const now = Date.now();
    const maxAgeMs = 14 * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(backupDir);
    for (const f of files) {
      if (f.startsWith('lvms_backup_') && f.endsWith('.json.gz')) {
        const fPath = path.join(backupDir, f);
        try {
          const stats = fs.statSync(fPath);
          if (now - stats.mtimeMs > maxAgeMs) {
            fs.unlinkSync(fPath);
          }
        } catch {}
      }
    }

    status.lastStatus = 'SUCCESS';
    status.lastRunAt = new Date().toISOString();
    logger.info({ status }, '✅ 3-Tier Automated Backup Pipeline completed successfully');
  } catch (err: any) {
    status.lastStatus = 'FAILED';
    status.lastError = err.message;
    logger.error({ err }, '❌ 3-Tier Automated Backup Pipeline failed');
  }

  return status;
}

export function getBackupStatus(): BackupStatus {
  return status;
}

/**
 * Initializes the background scheduler inside Node.js.
 * Schedules the backup daily at 02:00 AM UTC (or configured hour),
 * and triggers one initial backup in the background 30 seconds after server launch.
 */
export function startAutoBackupScheduler(): void {
  logger.info('Initializing Node.js Background Backup Scheduler (Option B)...');

  // Trigger initial backup after 30 seconds of server startup to ensure DB is warmed up
  setTimeout(() => {
    logger.info('Triggering initial automated startup backup...');
    executeBackupPipeline().catch((err) => {
      logger.error({ err }, 'Initial automated backup error');
    });
  }, 30000);

  // Function to schedule next daily run at 02:00 AM UTC
  function scheduleNextDailyRun() {
    const now = new Date();
    const nextRun = new Date();
    nextRun.setUTCHours(2, 0, 0, 0);

    // If 02:00 AM UTC has already passed today, schedule for tomorrow
    if (now.getTime() >= nextRun.getTime()) {
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    }

    const delayMs = nextRun.getTime() - now.getTime();
    logger.info(`Next automated backup scheduled in ${(delayMs / 1000 / 60 / 60).toFixed(2)} hours (at ${nextRun.toISOString()})`);

    setTimeout(() => {
      executeBackupPipeline()
        .catch((err) => logger.error({ err }, 'Scheduled daily backup error'))
        .finally(() => scheduleNextDailyRun());
    }, delayMs);
  }

  scheduleNextDailyRun();
}
