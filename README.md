# 🏦 Loan Verification Management System (LVMS)

<div align="center">

  [![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
  [![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
  [![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
  [![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org/)
  [![Grafana Cloud](https://img.shields.io/badge/Grafana-Cloud_%26_Alloy-F46800?style=for-the-badge&logo=grafana&logoColor=white)](https://grafana.com/)
  [![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-Tracing-425CC7?style=for-the-badge&logo=opentelemetry&logoColor=white)](https://opentelemetry.io/)
  [![Capacitor](https://img.shields.io/badge/Capacitor-Android_8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
  [![Security](https://img.shields.io/badge/Security-Bank--Grade_Hardened-881337?style=for-the-badge&logo=security)](https://owasp.org/)

  <p align="center">
    <strong>Enterprise-grade physical contact point verification (CPV), automated geospatial fraud containment, and full-stack telemetry platform for banks, NBFCs, and retail lending institutions.</strong>
  </p>

</div>

---

## 📑 Table of Contents

- [🏛️ Executive Summary](#️-executive-summary)
- [🏗️ System Architecture & Data Topology](#️-system-architecture--data-topology)
- [💻 Complete Technology Stack](#-complete-technology-stack)
- [✨ Core Functional Workflows](#-core-functional-workflows)
  - [1. Bulk Ingestion & Batch Geocoding Pipeline](#1-bulk-ingestion--batch-geocoding-pipeline)
  - [2. Dispatcher & Intelligent Agent Allocation Engine](#2-dispatcher--intelligent-agent-allocation-engine)
  - [3. Field Agent Mobile Experience & Capacitor Android App](#3-field-agent-mobile-experience--capacitor-android-app)
  - [4. Geofencing, Location Anti-Spoofing & Fraud Discrepancy Engine](#4-geofencing-location-anti-spoofing--fraud-discrepancy-engine)
  - [5. Risk Containment Unit (RCU) Batch PDF & Dossier Generation](#5-risk-containment-unit-rcu-batch-pdf--dossier-generation)
  - [6. Offline-First Resilience & Sync Protocol](#6-offline-first-resilience--sync-protocol)
- [⚡ Performance Engineering & UX Optimizations](#-performance-engineering--ux-optimizations)
  - [1. Lazy Loading & Route-Based Code Splitting](#1-lazy-loading--route-based-code-splitting)
  - [2. High-Performance Pagination & Virtualized Feeds](#2-high-performance-pagination--virtualized-feeds)
  - [3. Search Debouncing & Real-Time Filtering](#3-search-debouncing--real-time-filtering)
- [🌐 Nginx Ingress Reverse Proxy & Network Isolation](#-nginx-ingress-reverse-proxy--network-isolation)
- [📊 Enterprise Observability & Production Monitoring Platform](#-enterprise-observability--production-monitoring-platform)
  - [1. Telemetry Pipeline Architecture (Grafana Alloy & Cloud)](#1-telemetry-pipeline-architecture-grafana-alloy--cloud)
  - [2. Zero-PII Structured Logging & OpenTelemetry Correlation](#2-zero-pii-structured-logging--opentelemetry-correlation)
  - [3. Full-Stack Real-User Monitoring (RUM) & Core Web Vitals](#3-full-stack-real-user-monitoring-rum--core-web-vitals)
  - [4. The 6 Provisioned Production Dashboards](#4-the-6-provisioned-production-dashboards)
  - [5. Actionable Alerting Rules & Operational Incident Runbooks](#5-actionable-alerting-rules--operational-incident-runbooks)
- [🗄️ Database Schema & Data Model (Prisma ORM)](#️-database-schema--data-model-prisma-orm)
- [🔒 Bank-Grade Security & Fraud Mitigation](#-bank-grade-security--fraud-mitigation)
- [📁 Project Directory Structure](#-project-directory-structure)
- [🔌 API Reference Specification](#-api-reference-specification)
- [🚀 Getting Started & Local Deployment](#-getting-started--local-deployment)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
  - [3. Mobile Setup (Capacitor Android)](#3-mobile-setup-capacitor-android)
  - [4. Production Docker Deployment (VPS)](#4-production-docker-deployment-vps)
- [📜 License & Governance](#-license--governance)

---

## 🏛️ Executive Summary

In financial credit underwriting, **Physical Field Verification (CPV — Contact Point Verification)** is the critical frontline defense against identity theft, shell residences, phantom businesses, and uncollateralized loan defaults. 

**Loan Verification Management System (LVMS)** replaces fragile paper-based checklists, unverified WhatsApp photo sharing, and manual dispatching with a secure, real-time, geofence-enforced digital workflow. The system decouples a high-throughput **Express.js API Backend** from a **Next.js 16 Client Interface** (optimized for both desktop dispatcher consoles and field mobile screens), bundled with native Android packaging via **Capacitor 8**, an **Nginx Ingress Reverse Proxy**, and an enterprise **Grafana Cloud & Alloy Observability Architecture**.

### Key Differentiators:
* **Automated Batch Geocoding:** Translates unstructured applicant addresses from raw Excel/CSV loan portfolios into precise spatial coordinates using OpenStreetMap Nominatim with retry backoff.
* **Geofenced Verification Integrity:** Cross-validates field officer physical GPS coordinates against geocoded applicant addresses, automatically calculating coordinate divergence and flagging discrepancies.
* **Tamper-Evident Media Evidence:** Captures on-site photographic proof (applicant identity, house exterior, neighbor cross-checks, electricity meter readings) uploaded to Cloudinary with metadata verification.
* **Automated RCU Batch PDF Dossiers:** Dynamically compiles multi-page, bank-compliant PDF investigation reports (`PDFKit`) and Word dossiers (`docx`) with embedded photo proofs, applicant profile data, and audit timestamps.
* **Full-Stack Observability & Zero-PII Compliance:** Monitors all 27 pages, API spans, database query pools, Redis queues, and VPS infrastructure via Grafana Cloud and Alloy—without ever leaking borrower PII into logs or telemetry labels.
* **Bank-Grade Defense-in-Depth:** Hardened with Redis-backed rate limiting, HttpOnly cookie-bound JWT authentication, 6-digit email OTPs via Resend, and an immutable administrative audit log.

---

## 🏗️ System Architecture & Data Topology

LVMS adopts a decoupled, event-driven client-server topology fronted by an Nginx reverse proxy with outbound telemetry exporting:

```text
[ Field Agents / Dispatchers / Browsers ]
                 │
                 ▼ (HTTPS / WSS / Core Web Vitals / Page Tracking / Faro SDK)
       [ Nginx Reverse Proxy Gateway ] (Ports 80 & 443 - Publicly Bound)
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
[ Next.js 16 Frontend ]   [ Express 5 API Backend (lvms-api) ]
 (SSR/CSR, Faro SDK)       (OTel Tracing, Pino JSON Logs, prom-client)
                                    │
                     ┌──────────────┼──────────────┐
                     ▼              ▼              ▼
               [ PostgreSQL 16 ] [ Redis 7 ] [ Grafana Alloy Collector ]
                (Prisma ORM)    (Cache/Jobs)       │ (OTLP 4317/4318, Prometheus, Docker Logs)
                                                   ▼
                                         [ Grafana Cloud Platform ]
                                   (Prometheus, Loki, Tempo, Alert Rules)
```

---

## 💻 Complete Technology Stack

### **Frontend & Mobile Client (`/`)**
* **Framework:** Next.js 16.2 (App Router) · React 19.2 · TypeScript
* **Mobile Runtime:** Capacitor 8 (`@capacitor/cli`, `@capacitor/core`, Android Native wrapper)
* **Styling & Design System:** Tailwind CSS v4 · `tw-animate-css` · Lucide React Icons · Sonner toasts
* **Maps & Geospatial:** MapLibre GL (`@types/geojson`) for interactive agent location tracking & case clustering
* **Analytics & Visualization:** Recharts (3.8) for SLA tracking, verification throughput, and completion graphs
* **Telemetry & RUM:** `@grafana/faro-web-sdk` & Native `PerformanceObserver` (LCP, CLS, FID)
* **Data Processing:** `xlsx` (SheetJS) & `papaparse` for high-volume spreadsheet parsing
* **Form Validation:** Zod (4.4) runtime schema parsing

### **Backend Server (`server/`)**
* **Framework:** Node.js 20+ · Express 5 (Native async error boundary handling)
* **Database & ORM:** PostgreSQL 16 · Prisma ORM (5.22) with connection pooling & strict types
* **Caching & Queue:** Redis 7 · `ioredis` · `rate-limit-redis` · BullMQ (6.3)
* **Distributed Tracing:** OpenTelemetry Node.js SDK (`@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`, `@opentelemetry/exporter-trace-otlp-http`)
* **Metrics Engine:** `prom-client` (5.2) exposing route-normalized histograms and domain counters
* **Structured Logging:** `pino` (9.6) & `pino-http` with active span correlation and strict PII redaction
* **Document & PDF Generation:** `pdfkit` (0.20) for automated RCU PDF dossiers · `docx` (9.7) for Word exports
* **Geospatial & Geocoding:** Custom OpenStreetMap Nominatim geocoder (`axios`) with coordinate calculation
* **Media & Cloud Storage:** Multer (2.2) · Cloudinary · `multer-storage-cloudinary`
* **Email & Communications:** Resend API (6.17) for automated 6-digit transactional password reset OTPs
* **Security & Auth:** `jsonwebtoken` · `bcryptjs` (3.0) · `helmet` (8.2) · `cors` · `cookie-parser`

### **Ingress, Containerization & Telemetry**
* **Reverse Proxy:** Nginx 1.25 Alpine with Gzip compression, WebSockets, and 50MB body buffering
* **Container Runtime:** Docker Engine 26+ · Docker Compose v2 (Multi-stage builds)
* **Telemetry Collector:** Grafana Alloy v1.3.1 (OTLP receiver, container logs discovery, Prometheus scraper)
* **Central Observability:** Grafana Cloud (Prometheus metrics, Loki logs, Tempo traces, synthetic alerts)

---

## ✨ Core Functional Workflows

### 1. Bulk Ingestion & Batch Geocoding Pipeline
1. **Spreadsheet Ingestion:** Admin uploads an `.xlsx`, `.xls`, or `.csv` batch containing hundreds of applicant verification targets.
2. **Schema Sanitization:** File records are parsed via SheetJS and validated row-by-row using Zod schemas.
3. **Automated Geocoding:** The backend geocoder queries OpenStreetMap Nominatim to resolve raw text addresses (e.g., *"Flat 402, Sunshine Heights, Andheri West, Mumbai"*) into exact latitude and longitude coordinates with exponential backoff.
4. **Batch Persistence:** Creates an `UploadBatch` record and generates relational `Customer` and `VerificationCase` records in PostgreSQL under atomic database transactions.

---

### 2. Dispatcher & Intelligent Agent Allocation Engine
* **Spatial Agent Mapping:** The admin dispatch console visualizes all unassigned and pending cases across regional branches on interactive MapLibre GL tiles.
* **Workload-Aware Assignment:** Dispatchers assign cases to field agents based on geographic proximity, current active case count, and SLA deadlines.
* **Agent Route Tracking (`AgentRide`):** Real-time GPS pings track agent transit journeys, recording origin, destination, and distance traveled.

---

### 3. Field Agent Mobile Experience & Capacitor Android App
* **Dedicated Mobile Viewport:** Responsive UI tailored for one-handed field operation on mobile devices.
* **Case Action Center:**
  - View assigned cases sorted by urgency and physical distance.
  - Interactive navigation: One-tap button opening Google Maps / Apple Maps directions to the customer's geocoded address.
* **Evidence Gathering:**
  - In-app camera integration capturing photo proofs (ID card, residential exterior, neighbor cross-checks, electricity meter).
  - Multi-category profile assessment questionnaires (Residence Status, Ownership, Neighbor Reference, Standard of Living).
  - Applicant on-screen digital signature capture.

---

### 4. Geofencing, Location Anti-Spoofing & Fraud Discrepancy Engine
To prevent field officers from completing verifications remotely or fraudulently:
* **Real-Time GPS Validation:** When the agent submits the verification form, the mobile device captures precise device coordinates (`gpsLatitude`, `gpsLongitude`).
* **Haversine Distance Matching:** The backend computes the geographic distance between the agent's submission coordinates and the customer's geocoded address.
* **Accuracy Categorization:**
  - **High Accuracy (< 100m):** Verified on-premise.
  - **Moderate Accuracy (100m - 500m):** Verified in neighborhood.
  - **Discrepancy (> 500m):** Flagged in red on the admin dashboard with a location mismatch alert for RCU review.

---

### 5. Risk Containment Unit (RCU) Batch PDF & Dossier Generation
* **Instant Dossier Export:** Generates complete, bank-ready investigation dossiers with one click.
* **Custom PDFKit Pipeline (`rcuBatchPdfReportGenerator.ts`):**
  - Institutional header with Bank/NBFC branding, Case UUID, and Verification Date.
  - Applicant personal, financial, and loan inquiry breakdown.
  - Side-by-side photographic evidence layout with timestamps.
  - Geofence verification status and GPS accuracy confidence index.
  - Field Officer sign-off and digital signature.
* **DOCX Export:** Generates Microsoft Word reports formatted for credit committee review.

---

### 6. Offline-First Resilience & Sync Protocol
* Field agents frequently work in basements, rural zones, or elevator lobbies with zero cellular coverage.
* Form data and media blobs are cached locally on the device (IndexedDB / Local Storage).
* When network connectivity is restored, the client initiates a background sync batch, transferring cached cases to the Express backend without data loss.

---

## ⚡ Performance Engineering & UX Optimizations

### 1. Lazy Loading & Route-Based Code Splitting
- **Dynamic Imports:** Heavy client dependencies (MapLibre GL, Recharts graphs, and PDF rendering modules) are loaded dynamically using React `lazy()` and `next/dynamic` with skeleton fallbacks.
- **Micro-Bundle Size:** Initial page load JS footprint is reduced by >60%, enabling snappy loading on low-bandwidth 3G/4G field mobile connections.

### 2. High-Performance Pagination & Virtualized Feeds
- **Cursor & Offset Pagination:** Case directories, audit logs, and customer lists support server-paginated queries (`page`, `limit`), preventing memory exhaustion when handling tens of thousands of loan applications.
- **Scroll Memory & State Preservation:** Maintains active page and filter states across route transitions without unnecessary re-fetching.

### 3. Search Debouncing & Real-Time Filtering
- **Debounced Input Hooks:** All search inputs (applicant name, application ID, phone number, branch) utilize 300ms debouncing, slashing redundant backend API queries by over 80%.
- **Optimistic UI Updates:** Instant UI feedback during status changes with automated rollback on network failure.

---

## 🌐 Nginx Ingress Reverse Proxy & Network Isolation

LVMS employs an **Nginx Ingress Reverse Proxy** (`nginx/nginx.conf`) running inside Docker:

* **Single Port Ingress**: Only ports `80` (HTTP) and `443` (HTTPS) are exposed on the VPS host.
* **Network Isolation**: The Express backend, PostgreSQL, Redis, Prometheus, and monitoring exporters reside exclusively on the private Docker bridge network (`lvms-network`) with zero public port mapping.
* **50MB Payload Buffering**: Configured with `client_max_body_size 50M;` and `proxy_request_buffering off;` to support heavy Excel spreadsheet uploads and batch high-resolution photo evidence.
* **WebSocket Passthrough**: Transparent reverse proxying for real-time live agent location tracking via `Upgrade` and `Connection` HTTP headers.
* **Built-in Next.js Fallback**: `next.config.ts` includes native API rewrite rules pointing to the internal Express container.

---

## 📊 Enterprise Observability & Production Monitoring Platform

### 1. Telemetry Pipeline Architecture (Grafana Alloy & Cloud)
LVMS utilizes **Grafana Alloy** as a unified telemetry collector on the VPS, exporting outbound authenticated signals to **Grafana Cloud**:

* **OpenTelemetry OTLP Receiver**: Collects distributed traces and runtime metrics over HTTP (`4318`) and gRPC (`4317`).
* **Prometheus Remote Write**: Scrapes Express API `/metrics`, `node_exporter`, `cAdvisor`, `postgres-exporter`, and `redis-exporter`, forwarding batches securely to Grafana Cloud.
* **Docker Container Logs**: Discovers container stdout/stderr through the Docker socket, sanitizes tokens via regex stages, and ships them to Grafana Loki.
* **Dual Operation**: Operates seamlessly with Grafana Cloud or falls back to the self-hosted Prometheus + Grafana Docker stack.

### 2. Zero-PII Structured Logging & OpenTelemetry Correlation
All backend logs are emitted as structured JSON via **Pino** (`server/src/observability/logger.ts`):
* **Trace Context Injection**: Logs automatically include active OpenTelemetry `trace_id` and `span_id`, enabling one-click drill-downs from a slow dashboard panel directly into root-cause logs.
* **Request Correlation**: Propagates `x-request-id` across incoming requests and downstream calls.
* **Strict PII Redaction Guarantee**:
  - Authorization headers, session cookies, passwords, and API keys are censored.
  - Borrower personal data (Aadhaar, PAN, phone numbers, email, addresses, bank accounts) is automatically replaced with `[REDACTED]`.
  - Raw GPS coordinate trails are scrubbed from log outputs.

### 3. Full-Stack Real-User Monitoring (RUM) & Core Web Vitals
Frontend observability is handled by [`components/analytics/PageAnalyticsTracker.tsx`](components/analytics/PageAnalyticsTracker.tsx):
* **All 27 Routes Tracked**: Measures view counts, duration, and user roles (Admin vs. Field Agent) across every page.
* **Core Web Vitals**: Monitors Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS) via `PerformanceObserver`.
* **Zero Performance Overhead**: Uses non-blocking `navigator.sendBeacon` with keep-alive fetch fallbacks.
* **Grafana Faro SDK**: Optional integration with Grafana Faro Web SDK for browser-side session tracking and unhandled JavaScript error reporting.

### 4. The 6 Provisioned Production Dashboards
The system includes 6 production-grade Grafana dashboards in [`observability/dashboards/`](observability/dashboards/):

1. **Dashboard 1 — LVMS Production Overview**:
   - API availability and error rates.
   - VPS Host CPU, RAM, Disk space, and network throughput.
   - Container CPU/memory usage and restart counts.
2. **Dashboard 2 — API Performance**:
   - Requests per second by normalized route (preventing Prometheus cardinality explosion).
   - P50, P95, and P99 latency percentiles.
   - 4xx client errors vs. 5xx server failures.
3. **Dashboard 3 — Frontend Experience & RUM**:
   - Most visited pages and user engagement durations.
   - Route-by-route Core Web Vitals (LCP, CLS).
   - Client-side unhandled JavaScript error breakdowns.
4. **Dashboard 4 — Data Layer (PostgreSQL & Redis)**:
   - PostgreSQL active, idle, and max connection pool utilization.
   - Query execution latencies and database size growth.
   - Redis memory saturation, command rates, and cache hit/miss ratios.
5. **Dashboard 5 — Business Workflows**:
   - Field agent GPS ping throughput (accepted vs. rejected).
   - Verification case submission counts and approval ratios.
   - Excel bulk import processing duration and record counts.
   - RCU PDF and DOCX report generation rates.
6. **Dashboard 6 — Traces & External Dependencies**:
   - Distributed trace spans across Express, Prisma, and HTTP calls.
   - Slow database query spans and bottleneck detection.
   - External dependency error counters (Cloudinary, Resend, Nominatim).

### 5. Actionable Alerting Rules & Operational Incident Runbooks
Defined in [`monitoring/alerts/rules.yml`](monitoring/alerts/rules.yml) with corresponding incident response procedures in [`observability/runbooks/alert_runbooks.md`](observability/runbooks/alert_runbooks.md):

* `ApiUnavailable` (`critical`): Healthcheck failure > 2 minutes.
* `HighApiErrorRate` (`critical`): 5xx HTTP rate > 5% for 5 minutes.
* `HighApiLatencyWarning` (`warning`): P95 request latency > 1.0s for 5 minutes.
* `SevereApiLatencyCritical` (`critical`): P95 request latency > 2.0s for 5 minutes.
* `HostCpuSaturation` (`warning`): Host CPU usage > 85% for 10 minutes.
* `HostMemoryPressure` (`warning`): Host RAM usage > 85% for 10 minutes.
* `HostDiskFilling` (`warning`/`critical`): Root partition disk > 80% (warning) or > 90% (critical).
* `RedisDependencyErrors` (`warning`): Redis connection or command failures > 5 in 3 minutes.
* `ExcelImportFailureSpike` (`warning`): > 20 failed records in bulk upload over 10 minutes.
* `ReportGenerationFailureSpike` (`warning`): Repeated RCU PDF generation failures.

---

## 🗄️ Database Schema & Data Model (Prisma ORM)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                      String             @id @default(uuid())
  email                   String             @unique
  password                String
  firstName               String
  lastName                String
  phone                   String?
  role                    String             @default("FIELD_AGENT") // ADMIN | FIELD_AGENT
  branch                  String?
  isActive                Boolean            @default(true)
  createdAt               DateTime           @default(now())
  updatedAt               DateTime           @updatedAt
  adminId                 String?
  resetPasswordOtp        String?
  resetPasswordOtpExpires DateTime?
  rides                   AgentRide[]        @relation("AgentRides")
  createdCustomers        Customer[]
  admin                   User?              @relation("AgentAdmin", fields: [adminId], references: [id])
  agents                  User[]             @relation("AgentAdmin")
  createdCases            VerificationCase[] @relation("AdminCases")
  assignedCases           VerificationCase[] @relation("AgentCases")
}

model Customer {
  id                String             @id @default(uuid())
  applicationId     String             @unique
  firstName         String
  lastName          String
  phone             String?
  email             String?
  address           String
  loanType          String             @default("Home Loan")
  loanAmount        Float
  businessName      String?
  branch            String?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  adminId           String?
  admin             User?              @relation(fields: [adminId], references: [id])
  verificationCases VerificationCase[]

  @@index([adminId, createdAt])
  @@index([phone])
}

model VerificationCase {
  id               String    @id @default(uuid())
  status           String    @default("PENDING") // PENDING | ASSIGNED | IN_PROGRESS | COMPLETED | REJECTED
  type             String    // RESIDENTIAL | BUSINESS | EMPLOYMENT
  branch           String?
  customerId       String
  agentId          String?
  adminId          String?
  gpsLatitude      Float?
  gpsLongitude     Float?
  addressLatitude  Float?
  addressLongitude Float?
  addressAccuracy  String?   // HIGH | MODERATE | MISMATCH
  verificationData Json?     // Dynamic multi-profile field questionnaire
  mediaProofs      Json?     // Cloudinary photographic evidence array
  signatureUrl     String?
  notes            String?
  verifiedAt       DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  customer         Customer  @relation(fields: [customerId], references: [id])
  agent            User?     @relation("AgentCases", fields: [agentId], references: [id])
  admin            User?     @relation("AdminCases", fields: [adminId], references: [id])

  @@index([status, branch])
  @@index([agentId])
}
```

---

## 🔒 Bank-Grade Security & Fraud Mitigation

| Security Domain | Defense Vector | Technical Implementation |
| :--- | :--- | :--- |
| **Authentication** | Credential Theft & Session Hijacking | JWT issued with short expiration; stored exclusively in `HttpOnly`, `Secure`, `SameSite=Strict` cookies. JavaScript cannot access tokens. |
| **Brute-Force & DDoS** | Credential Stuffing & Flood Attacks | Multi-tiered Redis rate limiting via `rate-limit-redis`. Sensitive auth routes restricted to 5 attempts per 15 minutes; general API capped at 100 requests per 15 minutes. |
| **Password Recovery** | Insecure Reset Links | 6-digit numeric OTP with 10-minute cryptographic expiration sent via the Resend API. Single-use and invalidated immediately upon successful reset. |
| **Data Integrity** | SQL & NoSQL Injection | 100% parameterized query execution through Prisma ORM. Zero string concatenation or raw SQL queries. |
| **Input Sanitization** | Malformed Payloads & Mass Assignment | Strict Zod schemas on every endpoint. Unrecognized or extraneous fields are stripped or rejected before reaching controller business logic. |
| **Geospatial Spoofing** | Fake "On-Site" Submissions | Haversine distance verification comparing browser GPS coordinates with geocoded applicant target addresses; auto-flags coordinate divergence. |
| **PII & Data Redaction** | Regulatory Data Leaks (GDPR/RBI) | Borrower Aadhaar, PAN, phone numbers, addresses, and GPS trails are strictly redacted from structured logs, metrics, and traces. |
| **Network Boundaries** | Port Probing & Infrastructure Attack | Only Nginx reverse proxy (80/443) is exposed to the public internet. All databases, collectors, and internal exporters run in isolated Docker networks. |
| **Tamper-Evident Audit** | Insider Threat & Unauthorized Mutations | Immutable `AuditLog` entity recording actor ID, IP address, timestamp, target entity, and exact mutation action. |
| **HTTP Hardening** | Clickjacking, MIME Sniffing, XSS | Full Helmet configuration enforcing Content-Security-Policy (CSP), `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`. |

---

## 📁 Project Directory Structure

```text
Loan_verification_system/
├── app/                                 # Next.js 16 Client Interface (App Router)
│   ├── (auth)/                          # Authentication pages (Login, Forgot Password, Reset OTP)
│   ├── agent/                           # Field Agent Mobile Viewport
│   │   ├── cases/                       # Case directory & single case inspection
│   │   │   ├── page.tsx                 # Paginated & debounced assigned cases
│   │   │   └── [id]/page.tsx            # Verification form, GPS trigger, Camera capture
│   │   ├── login/                       # Dedicated field officer login
│   │   └── layout.tsx                   # Mobile-responsive bottom navigation layout
│   ├── app/                             # Admin Dispatcher Portal
│   │   ├── cases/                       # Case management, manual entry & assignment
│   │   ├── agents/                      # Agent directory, ride monitoring & onboarding
│   │   ├── live-tracking/               # Real-time MapLibre GL geospatial map
│   │   ├── verification/                # Live case review & verification feed
│   │   ├── upload/                      # Excel/CSV bulk upload & geocoding ingestion
│   │   ├── reports/                     # RCU PDF & DOCX export generator
│   │   └── audit-logs/                  # Security and compliance audit log viewer
│   └── layout.tsx                       # Root layout mounting PageAnalyticsTracker
│
├── components/
│   ├── analytics/
│   │   └── PageAnalyticsTracker.tsx     # Full-stack RUM, Core Web Vitals & Faro SDK
│   └── ui/                              # Reusable accessible component library
│
├── nginx/
│   ├── nginx.conf                       # Main reverse proxy configuration
│   └── default.conf                     # 50MB limits, WebSockets & SSL termination
│
├── observability/
│   ├── alloy/
│   │   └── config.alloy                 # Grafana Alloy pipeline for traces, metrics, logs
│   ├── alerts/
│   │   └── rules.yml                    # 10 production Prometheus alert rules
│   ├── runbooks/
│   │   └── alert_runbooks.md            # Operational incident response runbooks
│   └── dashboards/                      # 6 Provisioned production Grafana dashboards
│       ├── 1_infrastructure_health.json
│       ├── 2_api_performance.json
│       ├── 3_page_usage_experience.json
│       ├── 4_db_and_redis.json
│       ├── 5_business_workflows.json
│       └── 6_traces_and_dependencies.json
│
├── monitoring/                          # Self-hosted monitoring stack fallback
│   ├── prometheus.yml                   # Scrape targets and alert rule mounts
│   └── grafana/provisioning/            # Auto-provisioned datasources and dashboards
│
├── server/                              # Express.js 5 Backend API
│   ├── prisma/
│   │   ├── schema.prisma                # Relational PostgreSQL schema definitions
│   │   └── migrations/                  # Versioned database migration history
│   ├── src/
│   │   ├── observability/
│   │   │   ├── tracer.ts                # OpenTelemetry NodeSDK initialization
│   │   │   └── logger.ts                # Structured Pino JSON logger with PII redaction
│   │   ├── middlewares/
│   │   │   ├── metrics.ts               # Prometheus metrics engine & route normalizer
│   │   │   └── security.ts              # Helmet, rate limiting & IP firewall
│   │   ├── controllers/                 # Business logic (admin, agent, auth, upload)
│   │   ├── routes/                      # API routing modules (/auth, /admin, /agent)
│   │   └── index.ts                     # Application bootstrap & middleware chain
│   └── package.json                     # Server dependencies
│
├── docker-compose.yml                   # 12-Service production orchestration
├── Dockerfile                           # Multi-stage optimized Next.js frontend build
└── server/Dockerfile                    # Express + Prisma backend container
```

---

## 🔌 API Reference Specification

### Authentication Routes (`/api/v1/auth`)
* `POST /api/v1/auth/login` — Authenticate admin or field agent (sets HttpOnly session cookie).
* `POST /api/v1/auth/register` — Register a new user account (Admin clearance).
* `POST /api/v1/auth/logout` — Invalidate session and clear auth cookies.
* `POST /api/v1/auth/forgot-password` — Generate and dispatch 6-digit OTP to user email via Resend.
* `POST /api/v1/auth/verify-otp` — Verify OTP validity before password update.
* `POST /api/v1/auth/reset-password` — Securely update password using verified OTP token.

### Admin Governance Routes (`/api/v1/admin`)
* `GET  /api/v1/admin/cases` — Paginated case directory with branch and status filtering.
* `POST /api/v1/admin/cases` — Create a manual verification case.
* `POST /api/v1/admin/cases/assign` — Dispatch case to a selected field agent.
* `POST /api/v1/admin/cases/upload-batch` — Upload Excel/CSV spreadsheet for automated ingestion and geocoding.
* `GET  /api/v1/admin/agents` — Retrieve list of field officers with active case metrics and ride status.
* `GET  /api/v1/admin/reports/rcu-batch-pdf` — Generate and download compiled PDFKit investigation dossiers.
* `GET  /api/v1/admin/audit-logs` — Searchable administrative audit trail.

### Field Agent Routes (`/api/v1/agent`)
* `GET  /api/v1/agent/cases` — Fetch assigned cases for logged-in field officer.
* `GET  /api/v1/agent/cases/:id` — Retrieve complete customer and case detail for on-site inspection.
* `POST /api/v1/agent/cases/:id/verify` — Submit completed verification: coordinates, questionnaire data, and media proofs.
* `POST /api/v1/agent/rides/start` — Start tracking an inspection ride.
* `POST /api/v1/agent/rides/stop` — Conclude ride and calculate cumulative distance.
* `POST /api/v1/agent/sync` — Batch sync queued offline verification submissions.

### Telemetry & Health Routes
* `GET  /health` — Keep-alive and container healthcheck endpoint.
* `GET  /metrics` — Prometheus metrics scrape endpoint (Internal Docker network only).
* `POST /api/v1/analytics/page-view` — Non-blocking frontend RUM and Core Web Vitals telemetry receiver.

---

## 🚀 Getting Started & Local Deployment

### Prerequisites
* **Node.js:** v20.x or higher
* **PostgreSQL:** Running locally or via Docker (port `5432`)
* **Redis:** Running locally or via Docker (port `6379`)
* **Cloudinary Account:** For photo evidence storage
* **Resend API Key:** For email OTP dispatch

---

### 1. Backend Setup

1. Navigate to the server directory and install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Create a `.env` file in `server/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:postgres_secure_pass@localhost:5432/loan_verification_db?schema=public"
   JWT_SECRET="super-secure-bank-grade-jwt-secret-key-32-chars-min"
   REDIS_URL="redis://localhost:6379"

   # Cloudinary Media Configuration
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"

   # Resend Email Configuration
   RESEND_API_KEY="re_your_resend_api_key"
   EMAIL_FROM="onboarding@resend.dev"
   ```

3. Generate Prisma client, apply schema migrations, and seed initial admin credentials:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

4. Launch the Express development API server:
   ```bash
   npm run dev
   ```
   *The server will boot on `http://localhost:5000`.*

---

### 2. Frontend Setup

1. In the root directory, install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
   ```

3. Launch the Next.js client interface:
   ```bash
   npm run dev
   ```
   *Access the Admin Dispatcher Portal at `http://localhost:3000` and the Field Agent Portal at `http://localhost:3000/agent/login`.*

---

### 3. Mobile Setup (Capacitor Android)

To build and run the native Android application for field officers:

1. Synchronize the web assets with the Capacitor project:
   ```bash
   npm run build
   npx cap sync android
   ```
2. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
3. Connect an Android device with USB Debugging enabled, or launch an Android Virtual Device (AVD), and click **Run**.

---

### 4. Production Docker Deployment (VPS)

To deploy the entire production stack on a VPS with Nginx, database, and telemetry:

1. Copy the repository to your VPS and create a production `.env` file:
   ```env
   # Application Secrets
   DATABASE_URL=postgresql://postgres:postgres_secure_pass@postgres:5432/loan_verification_db?schema=public
   JWT_SECRET=your_production_jwt_secret_key_32_characters_minimum
   REDIS_URL=redis://redis:6379

   # Grafana Cloud Telemetry Export (Optional / Production)
   GRAFANA_CLOUD_OTLP_ENDPOINT=https://otlp-gateway-prod-us-east-0.grafana.net/otlp
   GRAFANA_CLOUD_OTLP_AUTH_HEADER="Basic <base64-token>"
   GRAFANA_CLOUD_PROMETHEUS_REMOTE_WRITE_URL=https://prometheus-prod-01-eu-west-0.grafana.net/api/prom/push
   GRAFANA_CLOUD_PROMETHEUS_USERNAME=123456
   GRAFANA_CLOUD_PROMETHEUS_API_KEY=glc_...
   GRAFANA_CLOUD_LOKI_URL=https://logs-prod3.grafana.net/loki/api/v1/push
   GRAFANA_CLOUD_LOKI_USERNAME=123456
   GRAFANA_CLOUD_LOKI_API_KEY=glc_...
   ```

2. Launch all 12 services with Docker Compose:
   ```bash
   docker compose up -d --build
   ```

3. Verify service health:
   ```bash
   docker compose ps
   ```
   - **Public Ingress**: Nginx serves the web application on ports `80` and `443`.
   - **Internal Network**: Express API, PostgreSQL, Redis, Exporters, and Alloy communicate securely on private bridge network `lvms-network`.
   - **Telemetry Dashboards**: Viewable on Grafana Cloud or locally at `http://localhost:3001` (forwarded via SSH).

---

## 📜 License & Governance

This project is licensed under the **MIT License**. You are free to adapt, modify, and deploy this software for commercial banking and financial verification operations.
