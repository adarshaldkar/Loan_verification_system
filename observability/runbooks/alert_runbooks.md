# LVMS Production Alert Runbooks

This guide provides operational triage steps for critical and warning alerts triggered by the Loan Verification Management System (LVMS).

---

## 1. ApiUnavailable (`severity: critical`)
- **Impact**: End users, field agents, and admin portal cannot authenticate, load cases, or submit data.
- **Triage Steps**:
  1. Check Docker container status on the VPS:
     ```bash
     docker compose ps
     ```
  2. Inspect the latest backend logs for unhandled crashes or failed connections:
     ```bash
     docker compose logs --tail=100 backend
     ```
  3. Verify PostgreSQL and Redis container health:
     ```bash
     docker compose logs --tail=50 postgres redis
     ```
  4. If the container crashed, restart it:
     ```bash
     docker compose restart backend
     ```

---

## 2. HighApiErrorRate (`severity: critical`)
- **Condition**: 5xx HTTP error rate exceeds 5% for 5 minutes.
- **Triage Steps**:
  1. Open **Grafana Dashboard 2 (API Performance)** or Grafana Cloud Explore.
  2. Filter by status code `500` or `502` to identify the failing normalized route (e.g., `/api/cases/:id/verify`, `/api/auth/login`).
  3. Correlate with OpenTelemetry Traces in Grafana Tempo or Grafana Cloud Traces using `http.status_code=500`.
  4. Inspect the offending span to determine if the failure originates from Prisma database timeout, Cloudinary, or geocoding service.
  5. Check `server/src/observability/logger.ts` outputs for the corresponding `x-request-id`.

---

## 3. HighApiLatencyWarning & SevereApiLatencyCritical (`severity: warning / critical`)
- **Condition**: P95 latency exceeds 1.0s or 2.0s for 5 minutes.
- **Triage Steps**:
  1. Open **Grafana Dashboard 2 & Dashboard 6 (Traces & Dependencies)**.
  2. Identify slow routes in the "Top Slow Endpoints" panel.
  3. Check PostgreSQL connection pool saturation:
     ```sql
     SELECT count(*), state FROM pg_stat_activity GROUP BY state;
     ```
  4. Check Redis responsiveness:
     ```bash
     docker compose exec redis redis-cli ping
     ```
  5. Check VPS CPU and RAM pressure on **Dashboard 1**.

---

## 4. HostCpuSaturation & HostMemoryPressure (`severity: warning`)
- **Condition**: VPS CPU or RAM exceeds 85% for 10 minutes.
- **Triage Steps**:
  1. Run `top` or `htop` on the VPS to identify high-consumption processes.
  2. Check which Docker container is consuming disproportionate resources:
     ```bash
     docker stats --no-stream
     ```
  3. If Excel imports or report generation are causing CPU spikes, verify if workers need queue throttling or memory limits in `compose.yaml`.

---

## 5. HostDiskFilling (`severity: warning / critical`)
- **Condition**: Root partition disk space exceeds 80% (warning) or 90% (critical).
- **Triage Steps**:
  1. Inspect disk usage:
     ```bash
     df -h /
     ```
  2. Prune unused Docker images, build caches, and orphan volumes:
     ```bash
     docker system prune -af --volumes
     ```
  3. Check Docker log sizes in `/var/lib/docker/containers/`.
  4. Ensure PostgreSQL WAL logs are rotating normally.

---

## 6. RedisDependencyErrors (`severity: warning`)
- **Condition**: Repeated Redis command failures or connection rejections.
- **Triage Steps**:
  1. Check Redis logs:
     ```bash
     docker compose logs --tail=100 redis
     ```
  2. Verify Redis memory consumption against `maxmemory`:
     ```bash
     docker compose exec redis redis-cli info memory
     ```
  3. Ensure network connectivity between backend and redis on Docker network `lvms-network`.

---

## 7. ExcelImportFailureSpike (`severity: warning`)
- **Condition**: High failure count during bulk case uploads.
- **Triage Steps**:
  1. Check Admin upload logs in Grafana Loki:
     ```
     {service="lvms-api"} |= "excel" |= "error"
     ```
  2. Common causes: Malformed Excel header formats, missing mandatory borrower columns, or duplicate case IDs.
  3. Verify whether failed rows were safely quarantined into the error summary without database rollbacks.

---

## 8. ReportGenerationFailureSpike (`severity: warning`)
- **Condition**: PDF / DOCX RCU report generation failures.
- **Triage Steps**:
  1. Check backend logs for LibreOffice / PDF generation worker timeouts.
  2. Check available memory on the container (`/tmp` disk space for temporary PDF output files).
  3. Re-run manual test report generation from the Admin reports dashboard.
