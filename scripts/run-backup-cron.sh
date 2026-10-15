#!/bin/bash
set -euo pipefail

# ==============================================================================
# Sky Line Risk Audit Services - LVMS Automated Backup Cron Runner
# Runs daily via crontab: exports database, compresses, and uploads to Backblaze B2.
# ==============================================================================

PROJECT_DIR="/opt/lvms"
if [ ! -d "$PROJECT_DIR" ]; then
  PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

cd "$PROJECT_DIR"

echo "=== [$(date -u)] Starting LVMS Automated Database Backup ==="

# Execute via running docker container if active, else directly via host Node
if docker compose ps --services 2>/dev/null | grep -q "backend"; then
  docker compose exec -T backend node scripts/backupToB2.js
else
  node scripts/backupToB2.js
fi

echo "=== [$(date -u)] Backup Finished Successfully ==="
