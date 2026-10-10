# 🏦 Loan Verification Management System (LVMS)

<div align="center">

  [![Next.js](https://img.shields.io/badge/Next.js-15.0-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Redis](https://img.shields.io/badge/Redis-Cache_%26_Queues-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Capacitor](https://img.shields.io/badge/Capacitor-Android_8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
  [![Security](https://img.shields.io/badge/Security-Bank--Grade_Hardened-881337?style=for-the-badge&logo=security)](https://owasp.org/)

  <p align="center">
    <strong>Enterprise-grade field investigation, geofenced risk containment, and automated physical loan verification platform for banking and non-banking financial institutions (NBFCs).</strong>
  </p>

</div>

---

## 📑 Table of Contents

- [Executive Summary](#-executive-summary)
- [System Architecture & Data Topology](#-system-architecture--data-topology)
- [Complete Technology Stack](#-complete-technology-stack)
- [Core Functional Workflows](#-core-functional-workflows)
  - [1. Bulk Ingestion & Batch Geocoding Pipeline](#1-bulk-ingestion--batch-geocoding-pipeline)
  - [2. Dispatcher & Intelligent Agent Allocation Engine](#2-dispatcher--intelligent-agent-allocation-engine)
  - [3. Field Agent Mobile Experience & Capacitor Android PWA](#3-field-agent-mobile-experience--capacitor-android-pwa)
  - [4. Geofencing, Location Anti-Spoofing & Fraud Discrepancy Engine](#4-geofencing-location-anti-spoofing--fraud-discrepancy-engine)
  - [5. Risk Containment Unit (RCU) Batch PDF & Dossier Generation](#5-risk-containment-unit-rcu-batch-pdf--dossier-generation)
  - [6. Offline-First Resilience & Sync Protocol](#6-offline-first-resilience--sync-protocol)
- [Database Schema & Data Model (Prisma ORM)](#-database-schema--data-model-prisma-orm)
- [Bank-Grade Security & Fraud Mitigation](#-bank-grade-security--fraud-mitigation)
- [Project Directory Structure](#-project-directory-structure)
- [API Reference Specification](#-api-reference-specification)
- [Getting Started & Local Deployment](#-getting-started--local-deployment)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
  - [3. Mobile Setup (Capacitor Android)](#3-mobile-setup-capacitor-android)
- [License & Governance](#-license--governance)

---

## 🏛️ Executive Summary

In financial credit underwriting, **Physical Field Verification (CPV — Contact Point Verification)** is the critical defense against identity fraud, shell residences, phantom businesses, and uncollateralized defaults. 

**Loan Verification Management System (LVMS)** replaces error-prone paper trails, unverified WhatsApp photo sharing, and manual dispatching with a secure, real-time, geofence-enforced digital workflow. The system decouples a high-throughput **Express.js API Backend** from a **Next.js 15 Client Interface** (optimized for both desktop dispatcher consoles and field mobile screens), complete with native Android packaging via **Capacitor 8**.

### Key Differentiators:
* **Automated Batch Geocoding:** Translates unstructured applicant addresses from raw Excel/CSV loan portfolios into precise spatial coordinates using OpenStreetMap Nominatim with retry backoff.
* **Geofenced Verification Integrity:** Cross-validates field officer physical GPS coordinates against geocoded applicant addresses, automatically calculating coordinate divergence and flagging discrepancies.
* **Tamper-Evident Media Evidence:** Captures on-site photographic proof (applicant identity, house exterior, neighbor cross-checks, electricity meter readings) uploaded to Cloudinary with metadata verification.
* **Automated RCU Batch PDF Dossiers:** Dynamically compiles multi-page, bank-compliant PDF investigation reports (`PDFKit`) and Word dossiers (`docx`) with embedded photo proofs, applicant profile data, and audit timestamps.
* **Bank-Grade Defense-in-Depth:** Hardened with Redis-backed rate limiting, HttpOnly cookie-bound JWT authentication, 6-digit email OTPs via Resend, and an immutable administrative audit log.

---

## 🏗️ System Architecture & Data Topology

LVMS adopts a decoupled, event-driven client-server topology:

```text
                           ┌──────────────────────────────────────────────┐
                           │      Next.js 15 Client (Web & Capacitor)     │
                           │  ┌────────────────────┐ ┌─────────────────┐  │
                           │  │ Admin Dispatch Hub │ │ Field Agent PWA │  │
                           │  │ (MapLibre/Charts)  │ │ (Camera/GPS/Sync│  │
                           │  └────────────────────┘ └─────────────────┘  │
                           └──────────────────────┬───────────────────────┘
                                                  │ HTTPS / REST (Port 3000 -> 5000)
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │            Express 5 API Gateway             │
                           │  ┌────────────────────────────────────────┐  │
                           │  │ Helmet · CORS · Redis Rate Limiters    │  │
                           │  │ HttpOnly JWT & Role Guards (RBAC)      │  │
                           │  │ Zod Schema Validation Pipes            │  │
                           │  │ Nominatim Batch Geocoder Engine        │  │
                           │  │ RCU Dossier PDFKit/DOCX Generator      │  │
                           │  └───────────────────┬────────────────────┘  │
                           └──────────────┬───────┴───────┬───────────────┘
                                          │               │
                     ┌────────────────────┴──┐      ┌─────┴───────────────────┐
                     ▼                       ▼      ▼                         ▼
             ┌───────────────┐     ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
             │  PostgreSQL   │     │ Redis Store   │  │  Cloudinary   │  │  Resend API   │
             │ (Prisma ORM)  │     │ (ioredis)     │  │ (Media CDN)   │  │ (Email OTP)   │
             │ • Users/Roles │     │ • Rate Limits │  │ • Geotagged   │  │ • Password    │
             │ • Customers   │     │ • BullMQ Jobs │  │   Photo Proof │  │   Reset OTPs  │
             │ • Cases/Rides │     │ • Ephemeral   │  │ • Signature   │  │ • Dispatch    │
             │ • Audit Logs  │     │   Pings       │  │   Capture     │  │   Alerts      │
             └───────────────┘     └───────────────┘  └───────────────┘  └───────────────┘
```

---

## 💻 Complete Technology Stack

### **Frontend & Mobile Client (`/`)**
* **Framework:** Next.js 15 (App Router) · React 19 · TypeScript
* **Mobile Runtime:** Capacitor 8 (`@capacitor/cli`, `@capacitor/core`, Android Native wrapper)
* **Styling & Design System:** Tailwind CSS v4 · `tw-animate-css` · Lucide React Icons · Sonner toasts
* **Maps & Geospatial:** MapLibre GL (`@types/geojson`) for interactive agent location tracking & case clustering
* **Analytics & Visualization:** Recharts (3.8) for SLA tracking, verification throughput, and completion graphs
* **Data Processing:** `xlsx` (SheetJS) & `papaparse` for high-volume spreadsheet parsing
* **Form Validation:** Zod (4.4) runtime schema parsing

### **Backend Server (`server/`)**
* **Framework:** Node.js 20+ · Express 5 (Async error handling natively enabled)
* **Database & ORM:** PostgreSQL 16 · Prisma ORM (5.22) with connection pooling & strict types
* **Caching & Queue:** Redis 7 · `ioredis` · `rate-limit-redis` · BullMQ (6.3)
* **Document & PDF Generation:** `pdfkit` (0.20) for automated RCU PDF dossiers · `docx` (9.7) for Word exports
* **Geospatial & Geocoding:** Custom OpenStreetMap Nominatim geocoder (`axios`) with coordinate calculation
* **Media & Cloud Storage:** Multer (2.2) · Cloudinary · `multer-storage-cloudinary`
* **Email & Communications:** Resend API (6.17) for automated 6-digit transactional password reset OTPs
* **Security & Auth:** `jsonwebtoken` · `bcryptjs` (3.0) · `helmet` (8.2) · `cors` · `cookie-parser`

---

## ✨ Core Functional Workflows

### 1. Bulk Ingestion & Batch Geocoding Pipeline
1. **Spreadsheet Ingestion:** Admin uploads an `.xlsx`, `.xls`, or `.csv` batch containing hundreds of applicant verification targets.
2. **Schema Sanitization:** File records are parsed via SheetJS and validated row-by-row using Zod.
3. **Automated Geocoding:** The backend geocoder queries OpenStreetMap Nominatim to resolve raw text addresses (e.g., *"Flat 402, Sunshine Heights, Andheri West, Mumbai"*) into exact latitude and longitude coordinates.
4. **Batch Persistence:** Creates an `UploadBatch` record and generates relational `Customer` and `VerificationCase` records in PostgreSQL under atomic database transactions.

---

### 2. Dispatcher & Intelligent Agent Allocation Engine
* **Spatial Agent Mapping:** The admin dispatch console visualizes all unassigned and pending cases across regional branches.
* **Workload-Aware Assignment:** Dispatchers assign cases to field agents based on geographic proximity, current active case count, and SLA deadlines.
* **Agent Route Tracking (`AgentRide`):** Live tracking of agent transit and physical inspection journeys, recording origin, destination, and distance traveled.

---

### 3. Field Agent Mobile Experience & Capacitor Android PWA
* **Dedicated Mobile Viewport:** Responsive UI tailored for one-handed operation on mobile devices.
* **Case Action Center:**
  - View assigned cases sorted by urgency and distance.
  - Interactive navigation: One-tap button opening Google Maps / Apple Maps directions to the customer's geocoded address.
* **Evidence Gathering:**
  - In-app camera integration capturing photo proofs (ID card, residential proof, business stock, meter).
  - Multi-category profile assessment questionnaires (Residence Status, Ownership, Neighbor Reference, Standard of Living).
  - Applicant digital signature capture.

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
  remarks          String?
  profileData      String?   // JSON structured questionnaire
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  completedAt      DateTime?
  media            Media[]
  admin            User?     @relation("AdminCases", fields: [adminId], references: [id])
  agent            User?     @relation("AgentCases", fields: [agentId], references: [id])
  customer         Customer  @relation(fields: [customerId], references: [id])

  @@index([adminId, status])
  @@index([agentId, status])
  @@index([status])
  @@index([createdAt])
  @@index([customerId])
}

model AgentRide {
  id          String    @id @default(uuid())
  agentId     String
  startTime   DateTime  @default(now())
  endTime     DateTime?
  startLat    Float
  startLng    Float
  endLat      Float?
  endLng      Float?
  distanceKm  Float     @default(0)
  status      String    @default("ACTIVE")
  agent       User      @relation("AgentRides", fields: [agentId], references: [id])
}

model Media {
  id        String           @id @default(uuid())
  caseId    String
  url       String
  publicId  String?
  type      String           // PHOTO | SIGNATURE | DOCUMENT
  caption   String?
  latitude  Float?
  longitude Float?
  createdAt DateTime         @default(now())
  case      VerificationCase @relation(fields: [caseId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id        String   @id @default(uuid())
  actor     String
  action    String   // CASE_ASSIGNED | VERIFICATION_SUBMITTED | BATCH_UPLOADED
  entity    String   // VerificationCase | User | Customer
  timestamp String
  ip        String
  createdAt DateTime @default(now())
  adminId   String?
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
| **Tamper-Evident Audit** | Insider Threat & Unauthorized Mutations | Immutable `AuditLog` entity recording actor ID, IP address, timestamp, target entity, and exact mutation action. |
| **HTTP Hardening** | Clickjacking, MIME Sniffing, XSS | Full Helmet configuration enforcing Content-Security-Policy (CSP), `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`. |

---

## 📁 Project Directory Structure

```text
Loan_verification_system/
├── app/                                 # Next.js 15 Client Interface (App Router)
│   ├── (auth)/                          # Authentication pages (Login, Forgot Password, Reset OTP)
│   ├── agent/                           # Field Agent Mobile Viewport
│   │   ├── cases/                       # Case list & single case verification submission
│   │   │   ├── page.tsx                 # Agent assigned cases
│   │   │   └── [id]/page.tsx            # Verification form, GPS trigger, Camera capture
│   │   ├── login/                       # Dedicated field officer login
│   │   └── layout.tsx                   # Mobile-responsive bottom bar layout
│   ├── app/                             # Admin Dispatcher Portal
│   │   ├── dashboard/                   # Real-time metrics & SLA overview
│   │   ├── cases/                       # Case management, manual entry & assignment
│   │   ├── agents/                      # Agent directory, ride monitoring & onboarding
│   │   ├── verification/                # Live case review & verification feed
│   │   ├── audit-logs/                  # Security and compliance audit log viewer
│   │   └── settings/                    # SLA policies and organization settings
│   └── components/                      # Reusable UI library (Radix UI, Tailwind v4, MapLibre)
│
├── server/                              # Express.js 5 Backend API
│   ├── prisma/
│   │   ├── schema.prisma                # Relational PostgreSQL schema definitions
│   │   └── migrations/                  # Versioned database migration history
│   ├── src/
│   │   ├── config/                      # Environment variables, Prisma client, Cloudinary, Redis
│   │   ├── controllers/
│   │   │   ├── admin/                   # Admin controllers (cases, agents, batches, reports)
│   │   │   ├── agent/                   # Agent controllers (cases, sync, ride pings, profile)
│   │   │   └── authController.ts        # Register, login, refresh, OTP reset
│   │   ├── middleware/                  # JWT auth guard, role-based access control, rate limiters
│   │   ├── routes/                      # API routing modules (/auth, /admin, /agent)
│   │   ├── utils/
│   │   │   ├── geocoder.ts              # OpenStreetMap Nominatim batch geocoding engine
│   │   │   └── rcuBatchPdfReportGenerator.ts # PDFKit bank dossier generator
│   │   └── index.ts                     # Express application bootstrap & middleware mounting
│   ├── seedAdmin.ts                     # Database seeding script for default admin & roles
│   └── package.json                     # Server dependencies
│
├── android/                             # Capacitor Native Android Mobile Project
│   ├── app/                             # Native Android Studio project files & Gradle manifests
│   └── capacitor.settings.gradle        # Capacitor bridge configurations
├── capacitor.config.ts                  # Capacitor native runtime configuration
└── package.json                         # Client workspace configuration
```

---

## 🔌 API Reference Specification

### Authentication Routes (`/api/auth`)
* `POST /api/auth/login` — Authenticate admin or field agent (sets HttpOnly session cookie).
* `POST /api/auth/register` — Register a new user account (Admin clearance).
* `POST /api/auth/logout` — Invalidate session and clear auth cookies.
* `POST /api/auth/forgot-password` — Generate and dispatch 6-digit OTP to user email via Resend.
* `POST /api/auth/verify-otp` — Verify OTP validity before password update.
* `POST /api/auth/reset-password` — Securely update password using verified OTP token.

### Admin Governance Routes (`/api/admin`)
* `GET  /api/admin/cases` — Paginated case directory with branch and status filtering.
* `POST /api/admin/cases` — Create a manual verification case.
* `POST /api/admin/cases/assign` — Dispatch case to a selected field agent.
* `POST /api/admin/cases/upload-batch` — Upload Excel/CSV spreadsheet for automated ingestion and geocoding.
* `GET  /api/admin/agents` — Retrieve list of field officers with active case metrics and ride status.
* `GET  /api/admin/reports/rcu-batch-pdf` — Generate and download compiled PDFKit investigation dossiers.
* `GET  /api/admin/audit-logs` — Searchable administrative audit trail.

### Field Agent Routes (`/api/agent`)
* `GET  /api/agent/cases` — Fetch assigned cases for logged-in field officer.
* `GET  /api/agent/cases/:id` — Retrieve complete customer and case detail for on-site inspection.
* `POST /api/agent/cases/:id/verify` — Submit completed verification: coordinates, questionnaire data, and media proofs.
* `POST /api/agent/rides/start` — Start tracking an inspection ride.
* `POST /api/agent/rides/stop` — Conclude ride and calculate cumulative distance.
* `POST /api/agent/sync` — Batch sync queued offline verification submissions.

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
   DATABASE_URL="postgresql://cms:cms_dev_password@localhost:5432/lvms?schema=public"
   JWT_SECRET="super-secure-bank-grade-jwt-secret-key-32-chars-min"
   REDIS_URL="redis://:cms_dev_password@localhost:6379"

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
   *The server will boot on [http://localhost:5000](http://localhost:5000).*

---

### 2. Frontend Setup

1. In a new terminal, navigate to the root directory and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000/api"
   ```

3. Launch the Next.js client interface:
   ```bash
   npm run dev
   ```
   *Access the Admin Dispatcher Portal at [http://localhost:3000](http://localhost:3000) and the Field Agent Viewport at [http://localhost:3000/agent/login](http://localhost:3000/agent/login).*

---

### 3. Mobile Setup (Capacitor Android)

To test or build the native Android application for field agents:

1. Ensure the Android SDK and Android Studio are installed.
2. Synchronize the web assets with the Capacitor native project:
   ```bash
   npm run build
   npx cap sync android
   ```
3. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
4. Connect an Android device with USB Debugging enabled, or launch an Android Virtual Device (AVD), and click **Run**.

---

### 4. Production Observability & Monitoring Setup

LVMS is equipped with an enterprise-grade observability architecture supporting both local Prometheus/Grafana stacks and outbound telemetry forwarding to **Grafana Cloud via Grafana Alloy**:

1. **Architecture & Collector**:
   - **Grafana Alloy** collector receives OpenTelemetry OTLP traces (`port 4318`), scrapes Prometheus metrics, and ingests Docker container logs.
   - Forwards authenticated telemetry to Grafana Cloud (Tempo, Prometheus remote write, Loki) without opening internal database ports to the internet.
2. **Standard Provisioned Dashboards**:
   - `1_infrastructure_health.json`: VPS CPU, RAM, Disk, and Container saturation.
   - `2_api_performance.json`: Normalized routes, P50/P95/P99 latency, 4xx/5xx status rates.
   - `3_page_usage_experience.json`: Real-user monitoring across all 27 Next.js routes with Core Web Vitals (LCP, CLS).
   - `4_db_and_redis.json`: PostgreSQL connections, Prisma query latencies, and Redis cache throughput.
   - `5_business_workflows.json`: GPS pings, case submissions, Excel bulk ingestion, and report generation.
   - `6_traces_and_dependencies.json`: Distributed traces, slow database spans, and external service errors.
3. **Runbooks & Alerts**:
   - Detailed incident triage procedures available at [`observability/runbooks/alert_runbooks.md`](observability/runbooks/alert_runbooks.md).
   - Prometheus alert rules configured in [`monitoring/alerts/rules.yml`](monitoring/alerts/rules.yml).

---

## 📜 License & Governance

This project is licensed under the **MIT License**. You are free to adapt, modify, and deploy this software for commercial banking and financial verification operations.
