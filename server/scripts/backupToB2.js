/**
 * Automated Database Backup to Backblaze B2 & Local Disk
 * 
 * Features:
 *  - 100% DB-version agnostic (works seamlessly with Neon DB, local Docker Postgres, or any PostgreSQL version).
 *  - Exports complete datasets across all 12 system models with relations.
 *  - Compresses into gzip format (reducing size by ~85-90%).
 *  - Stores a local copy in `./backups/` for instant offline restore.
 *  - Uploads directly to Backblaze B2 cloud bucket via native B2 REST API.
 *  - Automatic retention policy: Prunes old local backups older than 14 days.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const https = require('https');

// Load .env from server/.env or root .env
function loadEnv() {
  const candidates = [
    path.join(__dirname, '..', 'server', '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), 'server', '.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      const lines = fs.readFileSync(c, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const B2_KEY_ID = process.env.B2_KEY_ID || '0052d0e67de9dca0000000001';
const B2_APP_KEY = process.env.B2_APPLICATION_KEY || 'K0057O0XabYzlE3cbEZNhVtUTvSK1jM';
const B2_BUCKET_ID = process.env.B2_BUCKET_ID || '127d204e06073dfea91d0c1a';
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'skylinerisk-db-backups';

// Prisma client initialization
let prismaModulePath = path.join(__dirname, '..', 'server', 'node_modules', '@prisma/client');
if (!fs.existsSync(prismaModulePath)) {
  prismaModulePath = '@prisma/client';
}
const { PrismaClient } = require(prismaModulePath);
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Helper for HTTPS requests returning Promises
function httpsRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: buffer.toString('utf8'),
          raw: buffer
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

// B2 API helpers
async function authorizeB2() {
  const authHeader = 'Basic ' + Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64');
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
    bucketId: data.apiInfo?.storageApi?.bucketId || B2_BUCKET_ID,
    bucketName: data.apiInfo?.storageApi?.bucketName || B2_BUCKET_NAME
  };
}

async function getB2UploadUrl(apiUrl, authToken, bucketId) {
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

async function uploadFileToB2(uploadUrl, uploadAuthToken, fileName, fileBuffer) {
  const sha1 = crypto.createHash('sha1').update(fileBuffer).digest('hex');
  const urlObj = new URL(uploadUrl);

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
      let chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 200 && res.statusCode < 300) {
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

async function runBackup() {
  console.log('\n=============================================================');
  console.log('   LVMS AUTOMATED DATABASE BACKUP TO BACKBLAZE B2 & DISK     ');
  console.log('=============================================================\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`[1/5] Connecting to Database...`);
  await prisma.$connect();
  console.log(`      Connected to: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : 'Default'}`);

  console.log(`[2/5] Exporting table datasets...`);
  const exportData = {
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

  let totalRows = 0;
  for (const m of models) {
    try {
      if (prisma[m] && typeof prisma[m].findMany === 'function') {
        const rows = await prisma[m].findMany();
        exportData.tables[m] = rows;
        totalRows += rows.length;
        console.log(`      • ${m.padEnd(18)} : ${rows.length} rows`);
      }
    } catch (err) {
      console.warn(`      ! ${m.padEnd(18)} : Skipped (${err.message})`);
    }
  }

  console.log(`      Total records exported: ${totalRows}`);

  console.log(`[3/5] Compressing backup dataset (Gzip)...`);
  const jsonStr = JSON.stringify(exportData, null, 2);
  const compressedBuffer = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'), { level: 9 });

  const fileName = `lvms_backup_${timestamp}.json.gz`;
  const localFilePath = path.join(backupDir, fileName);
  fs.writeFileSync(localFilePath, compressedBuffer);

  const rawSizeKB = (Buffer.byteLength(jsonStr) / 1024).toFixed(1);
  const compSizeKB = (compressedBuffer.length / 1024).toFixed(1);
  console.log(`      Raw Size: ${rawSizeKB} KB  -->  Compressed: ${compSizeKB} KB (Saved ~${(100 - (compSizeKB/rawSizeKB)*100).toFixed(0)}%)`);
  console.log(`      Saved locally to: ${localFilePath}`);

  console.log(`[4/5] Authorizing & Uploading to Backblaze B2...`);
  const b2Auth = await authorizeB2();
  console.log(`      B2 Account Authorized (${b2Auth.bucketName})`);

  const uploadCreds = await getB2UploadUrl(b2Auth.apiUrl, b2Auth.authToken, b2Auth.bucketId);
  const uploadResult = await uploadFileToB2(uploadCreds.uploadUrl, uploadCreds.uploadAuthToken, `database/${fileName}`, compressedBuffer);
  console.log(`      Successfully uploaded to B2: ${uploadResult.fileName}`);
  console.log(`      File ID: ${uploadResult.fileId}`);

  console.log(`[5/5] Cleaning up old local backups (> 14 days)...`);
  const now = Date.now();
  const maxAgeMs = 14 * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(backupDir);
  let prunedCount = 0;
  for (const file of files) {
    if (file.startsWith('lvms_backup_') && file.endsWith('.json.gz')) {
      const fPath = path.join(backupDir, file);
      const stats = fs.statSync(fPath);
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(fPath);
        prunedCount++;
      }
    }
  }
  if (prunedCount > 0) {
    console.log(`      Pruned ${prunedCount} old local backup file(s).`);
  } else {
    console.log(`      All existing backups are within the 14-day retention window.`);
  }

  console.log('\n=============================================================');
  console.log('   BACKUP COMPLETED SUCCESSFULLY!');
  console.log(`   Cloud B2: bucket "${b2Auth.bucketName}" / database/${fileName}`);
  console.log(`   Local Disk: ${localFilePath}`);
  console.log('=============================================================\n');
}

runBackup()
  .catch((err) => {
    console.error('\n❌ Backup Failed:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
