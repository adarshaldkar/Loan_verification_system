# Loan Verification Management System - Comprehensive Architecture & Design

This document details the complete, enterprise-grade architecture for the Loan Verification Management System, incorporating all security, caching, monitoring, and background processing layers required for a 500+ Admin Panel scale.

---

## 🔒 1. Security Layer (Backend)
Security is critical for financial data. The backend will implement:
- **Authentication**: JWT Access Tokens & Refresh Tokens.
- **Authorization**: Strict RBAC (Role-Based Access Control) to differentiate Admins vs Agents.
- **Rate Limiting**: `express-rate-limit` to prevent DDoS and brute-force attacks at the API level.
- **SQL Injection Protection**: Fully handled by Prisma ORM natively (parameterized queries).
- **XSS & CSRF Protection**: Data sanitization (Zod) and secure headers.
- **CORS & Helmet**: Pre-configured in Express to block unauthorized domains and secure HTTP headers.
- **Validation**: Strict Input Validation (`zod`) and File Validation (MIME type & size limits before hitting Cloudinary).
- **HTTPS Everywhere & Secret Management**: Enforced via `.env` and environment configs.

## 🗄️ 2. Database Layer
- **PostgreSQL**: Hosted on Neon.tech for auto-scaling and connection pooling (vital for 500 admin panels).
- **Prisma ORM**: For type-safe queries.
- **Optimization**: We will implement proper Indexing on frequently queried fields (like `customerId` and `agentId`).
- **Future-proofing**: Designed to support Read Replicas and Partitioning when data grows massively.

## ⚡ 3. Cache & Queue Layer (Redis + BullMQ)
To prevent the API from crashing during heavy loads (e.g., 500 admins uploading data simultaneously):
- **Redis Cache**: Caching heavy dashboard analytics, session data, and API responses.
- **BullMQ (Queue Layer)**: Background jobs managed by Redis for:
  - Processing heavy Excel Imports.
  - Generating PDF/Excel Reports.
  - Image processing (if not fully offloaded to Cloudinary).
  - Sending async Notifications.

## 📂 4. Storage & GIS Layer
- **File Storage**: **Cloudinary** (replacing S3 for better on-the-fly image optimization and CDN delivery).
- **Security**: Signed URLs and Lifecycle rules.
- **GIS (Google Maps)**: For GPS location capturing, distance matrix, and reverse geocoding to verify agent presence.

## 📈 5. Monitoring & Logging Layer
- **Logging**: **Winston** or **Pino** for structured JSON logging.
  - Request Logs, Error Logs, Audit Logs (tracking every action an Admin or Agent takes).
- **Observability**: **Sentry** (for real-time error tracking) and health check endpoints. (Prometheus/Grafana can be attached to these endpoints later).

---

## 🚀 Proposed Folder Structure (server/)

```text
server/
├── src/
│   ├── config/             # DB, Redis, Cloudinary, Logger (Winston)
│   ├── controllers/        # Route handlers
│   ├── middlewares/        # Auth (JWT), Rate Limiter, Zod Validation, Error Handler
│   ├── models/             # Prisma Schema
│   ├── routes/             # Express API Routes
│   ├── services/           # BullMQ Workers, Maps logic
│   ├── utils/              # Helpers
│   └── index.ts            # Entry point (Helmet, CORS applied here)
├── prisma/
│   └── schema.prisma       
├── .env
├── package.json
└── tsconfig.json
```

## 🛠️ Implementation Steps (Phase 1: Admin & Agent Core)

As requested, we will focus first on the Admin and Agent features while keeping this system design deeply integrated:
1. Initialize the PostgreSQL database on Neon.tech.
2. Build the Auth system (JWT + RBAC + Rate Limiting).
3. Build the Customer & Case Assignment logic.
4. Integrate Cloudinary for Geo-tagged photo uploads.
5. Set up Winston logging for audit trails.

> [!IMPORTANT]
> **Admin Panel Backend API Plan (Ready for Review)**
> We are now focusing entirely on the APIs powering the Admin Web Panel. Below is the proposed structure for the next coding phase.
> 
> ## 💻 Phase 2: Admin Panel APIs
> 
> ### 1. Agent Management API (`/api/v1/admin/agents`)
> - `POST /register`: Admins can create new Field Agents and assign them to branches.
> - `GET /`: Fetch a list of all Field Agents, their current workload, and status.
> 
> ### 2. Customer & Case Management API (`/api/v1/admin/cases`)
> - `POST /`: Add a new loan applicant (Customer) and automatically generate a `PENDING` Verification Case.
> - `PUT /:caseId/assign`: Assign a pending case to a specific Field Agent.
> 
> ### 3. Verification Review API (`/api/v1/admin/reviews`)
> - `GET /`: Fetch all submitted verification reports (including geo-tagged Cloudinary photos and GPS coordinates).
> - `PUT /:caseId/status`: Admin can review the agent's report and mark the case as `COMPLETED` or `REJECTED`.
> 
> ### 4. Dashboard Analytics API (`/api/v1/admin/analytics`)
> - `GET /`: Returns aggregate stats for the Admin Dashboard (Total Customers, Agents online, Success vs Rejection rates).
> 
> **Are you ready for me to start coding these specific Admin Panel APIs?**
