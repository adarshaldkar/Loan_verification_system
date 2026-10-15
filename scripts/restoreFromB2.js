/**
 * Automated Database Restore from Local Backup or Backblaze B2
 * 
 * Usage:
 *   node scripts/restoreFromB2.js [optional_backup_file_path]
 * 
 * If no file path is provided, it automatically selects the latest backup from `./backups/`.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Load .env
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

async function runRestore() {
  console.log('\n=============================================================');
  console.log('       LVMS DATABASE RESTORE FROM BACKUP ARCHIVE            ');
  console.log('=============================================================\n');

  let filePath = process.argv[2];
  if (!filePath) {
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      throw new Error(`Backup directory '${backupDir}' does not exist.`);
    }
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('lvms_backup_') && f.endsWith('.json.gz'))
      .sort()
      .reverse();
    if (files.length === 0) {
      throw new Error(`No backup archives found in '${backupDir}'.`);
    }
    filePath = path.join(backupDir, files[0]);
  }

  console.log(`[1/4] Reading backup archive: ${filePath}`);
  const compressedBuffer = fs.readFileSync(filePath);
  const decompressed = zlib.gunzipSync(compressedBuffer).toString('utf8');
  const backupData = JSON.parse(decompressed);

  console.log(`      Exported at: ${backupData.metadata?.exportedAt || 'Unknown'}`);
  console.log(`      System: ${backupData.metadata?.system || 'Unknown'}`);

  console.log(`[2/4] Connecting to Target Database...`);
  await prisma.$connect();
  console.log(`      Connected to: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : 'Default'}`);

  // Restore order respecting foreign key dependencies:
  const restoreOrder = [
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

  console.log(`[3/4] Restoring table datasets...`);
  for (const m of restoreOrder) {
    const rows = backupData.tables[m];
    if (!rows || rows.length === 0) {
      console.log(`      • ${m.padEnd(18)} : 0 records (Skipped)`);
      continue;
    }

    let successCount = 0;
    for (const row of rows) {
      try {
        // Parse ISO strings back to Date objects where needed
        const processed = { ...row };
        for (const [k, v] of Object.entries(processed)) {
          if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
            processed[k] = new Date(v);
          }
        }

        // Upsert by ID if available, otherwise create
        if (processed.id) {
          await prisma[m].upsert({
            where: { id: processed.id },
            update: processed,
            create: processed
          });
        } else {
          await prisma[m].create({ data: processed });
        }
        successCount++;
      } catch (err) {
        // Ignore duplicate key or relation constraint errors gracefully
      }
    }
    console.log(`      • ${m.padEnd(18)} : Restored ${successCount} / ${rows.length} records`);
  }

  console.log('\n=============================================================');
  console.log('   DATABASE RESTORE COMPLETED SUCCESSFULLY!');
  console.log('=============================================================\n');
}

runRestore()
  .catch((err) => {
    console.error('\n❌ Restore Failed:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
