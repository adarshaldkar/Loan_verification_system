# Loan Verification Management System - System Design

## 1. Executive Summary
The Loan Verification Management System is an enterprise-grade platform designed to digitize and manage the physical verification of loan applicants. It connects Admin teams, Field Verification Agents, and Monitoring teams through a unified backend. The architecture is designed to be cloud-native, horizontally scalable, and highly secure to meet banking-grade standards.

---

## 2. System Architecture Layers

Based on the target High-Level Design (HLD), the system is divided into distinct operational layers:

### A. Edge & Security Layer
- **Components:** DNS, CDN (CloudFront/Cloud CDN), WAF, DDoS Protection (AWS Shield), SSL/TLS.
- **Purpose:** Secure incoming requests before they hit the application infrastructure.

### B. Traffic Management Layer
- **Components:** Global Load Balancer ➔ Reverse Proxy (Nginx) ➔ API Gateway.
- **Purpose:** Handle rate limiting, throttling, and initial request filtering/validation.

### C. Application / Service Layer (Modular Monolith)
- **Auth Service:** Login/Logout, JWT & Role Management.
- **User Service:** Manage Agents, Admins, Branches, and Permissions.
- **Customer Service:** Customer CRUD, Excel Import processing.
- **Verification Service:** Case Assignment, Visit Management, Profile data collection.
- **Media Service:** Photo upload, compression, and metadata extraction.
- **Notification Service:** Push, Email, and SMS notifications.
- **Report Service:** Dashboards, analytics, PDF/Excel exports.

### D. Data & Storage Layer
- **Primary Database:** PostgreSQL (ACID compliance, relational mapping).
- **Read Replica:** For scaling reporting and heavy read queries.
- **Cache:** Redis (Session cache, API cache, Rate limiting store).
- **File Storage:** AWS S3 / Cloud Storage for photos and documents, served via CDN.

### E. Async & Integration Layer
- **Message Queue:** BullMQ (Redis-based) for background tasks.
- **Worker Services:** Image processing, Excel parsing, Report generation.
- **External Integrations:** Google Maps API (Geocoding/Distance), SMS Gateway, Email Service (SES/SendGrid), Push Notifications (FCM/APNS).

### F. Monitoring & Observability
- **Tools:** Prometheus (Metrics), Grafana (Dashboards), Sentry (Error Tracking), ELK/OpenSearch (Logs).

---

## 3. Implementation Status (To-Do List)

### ✅ Completed (Current MVP State)
- [x] **Database:** PostgreSQL configured with Prisma ORM schema mapped to requirements.
- [x] **Backend Framework:** Node.js, Express.js, TypeScript boilerplate established.
- [x] **Authentication:** Basic JWT implementation for Admin users.
- [x] **Admin Panel (Frontend):** Next.js dashboard, bulk Excel upload, customer/case management UI.
- [x] **Mock Data Seeding:** Script to populate branches, agents, customers, and cases.

### 🚧 Work In Progress (Immediate Next Steps)
- [ ] **Backend Refactoring:** Dismantling the monolithic `adminController.ts` into specific service controllers.
- [ ] **Agent Mobile APIs:** Building secure, role-restricted endpoints for the Field Agent app (get assigned cases, submit visit data).
- [ ] **Security Hardening:** Implementing `express-rate-limit` and `helmet` for foundational security.

### ❌ Remaining (Target Architecture Goals)
- [ ] **Caching Layer:** Integrate Redis for performance optimization.
- [ ] **Asynchronous Processing:** Set up BullMQ for heavy tasks (e.g., moving Excel processing off the main thread).
- [ ] **Cloud Storage:** Migrate local/mocked file storage to AWS S3 with signed URLs.
- [ ] **External Integrations:** Connect Google Maps APIs for coordinate validation and distance calculation.
- [ ] **Observability:** Deploy Sentry for error tracking and Prometheus for metrics.
- [ ] **Infrastructure as Code (IaC):** Dockerize the application and set up CI/CD pipelines.
