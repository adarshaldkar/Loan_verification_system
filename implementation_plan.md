# Loan Verification Management System - Comprehensive Architecture & Design

I have thoroughly analyzed the system design diagrams and documentation you provided. Here is the complete, detailed breakdown of the entire project—from UI/UX to the backend system design—including the update to use **Cloudinary** for file storage.

---

## 1. System Design & High-Level Architecture (HLD)

The system follows a highly scalable, production-ready architecture divided into strict layers to handle thousands of concurrent field agents and admin operations.

### A. Edge & Security Layer
- **DNS & CDN**: Routes user requests securely and caches static frontend assets for fast loading.
- **WAF & DDoS Protection**: Web Application Firewall to block malicious traffic before it hits our servers.
- **SSL/TLS**: HTTPS everywhere for banking-grade encrypted communication.

### B. Traffic Management Layer
- **Global Load Balancer & Reverse Proxy (Nginx)**: Distributes incoming API traffic efficiently across backend instances.
- **API Gateway**: Handles request filtering, rate limiting (preventing spam), and throttling.

### C. Application & Service Layer (Modular Monolith)
Written in **Node.js, TypeScript, and Express.js**, this layer is split into distinct logical services:
1. **Auth Service**: Login, JWT generation, Role-Based Access Control (RBAC).
2. **User Service**: Managing Admin and Agent profiles, branches, and permissions.
3. **Customer Service**: Customer CRUD, bulk Excel imports, and duplicate detection.
4. **Verification Service**: The core engine! Handles case assignment, visit tracking, residential/business profiles, and status updates.
5. **Media Service**: Handles photo uploads, compression, and geo-tag metadata extraction (now using **Cloudinary**).
6. **Notification & Report Service**: SMS/Email/Push notifications and automated PDF/Excel report generation.

### D. Data & Storage Layer
- **Primary Database**: **PostgreSQL** (with Prisma ORM) ensuring ACID compliance for critical financial data.
- **Caching**: **Redis** for API caching, session storage, and fast dashboard analytics.
- **File Storage**: **Cloudinary** (Replacing AWS S3) for lightning-fast geo-tagged photo uploads, on-the-fly image optimization, and secure media delivery via its built-in CDN.

### E. Async & Integration Layer
- **Message/Job Queue (BullMQ + Redis)**: Handles heavy background tasks so the API never slows down. Workers include: Image processing, Excel data parsing, and Notification dispatching.
- **External Integrations**: Google Maps API (Navigation/Geocoding), SMS/Email Gateways, Push Notifications.

---

## 2. The Three User Panels (Frontend & Mobile)

### A. Admin Panel (Web)
- **Tech Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS, ShadCN UI.
- **Purpose**: The command center for branch managers.
- **Key Features**: 
  - Real-time dashboard & analytics.
  - Bulk Excel imports for thousands of customers at once.
  - Live tracking of field agents on a map.
  - Reviewing submitted verification reports and approving/closing cases.

### B. Field Verification Agent (Mobile App)
- **Tech Stack**: React Native (Expo).
- **Purpose**: The on-ground tool for agents visiting applicant locations.
- **Key Features**:
  - Offline-first capabilities (for poor network areas).
  - Google Maps integration for routing.
  - Forms for Residential (house size, rent, family) and Business (office size, staff, nature of business) profiles.
  - **Geo-tagged Photo Capture**: Appending GPS coordinates and timestamps natively to photos before pushing to Cloudinary.

### C. Monitoring Panel (Web)
- **Purpose**: For the DevOps/Engineering team.
- **Key Features**: Application logs, system health monitoring, API performance tracking, and error exception tracking (Sentry).

---

## 3. Database Design (PostgreSQL + Prisma)

Because data integrity is critical, a relational database is mandatory.
- **Users Table**: Stores Admins, Managers, and Field Agents.
- **Customers Table**: Stores loan applicants, loan amounts, and basic details.
- **Verification_Cases Table**: The central link connecting an Agent, a Customer, and the outcome. Includes statuses (`ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`).
- **Media Table**: Stores Cloudinary URLs and extracted EXIF data (GPS latitude/longitude, timestamp) to prove the agent was physically present.

---

## 4. UI/UX & Design Philosophy

As we discussed earlier, the UI must feel **premium, modern, and highly trustworthy**.
- **Visuals**: Deep navy and dark modes (`#050B18`) combined with vibrant accents (Teal, Blue, Purple).
- **Glassmorphism**: Translucent cards with blurred backgrounds to give a sense of depth and modernity.
- **Micro-animations**: Smooth hover effects, data loading skeletons, and interactive charts.
- **Mobile UX**: The React Native app must feature large, highly tappable buttons, high contrast for outdoor sunlight readability, and extremely clear error messages if GPS or network fails.

---

## 5. The Business Workflow (End-to-End)

1. **Upload**: Admin bulk-uploads applicants via Excel.
2. **Assign**: The backend assigns cases to nearby agents.
3. **Navigate**: Agent opens the Mobile App, clicks "Start Visit", and navigates via Google Maps.
4. **Verify**: Agent meets the applicant, fills out the specific dynamic form (Residential or Business).
5. **Capture**: Agent takes photos. The app locks the GPS location and timestamp.
6. **Submit**: Data is uploaded to the backend (photos go to Cloudinary, data goes to PostgreSQL).
7. **Approve**: Admin reviews the geo-tagged proof and completes the case.

> [!IMPORTANT]
> **User Review Required**
> I have completely detailed the system architecture from the diagrams, ensuring all microservices, layers, and asynchronous flows are covered. I have also swapped out AWS S3 for **Cloudinary** for our file storage.
> 
> Let me know if this perfects our understanding of the project, and if you are ready for me to set up the `client/` and `server/` codebase structure!
