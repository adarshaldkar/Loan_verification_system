# Loan Verification Management System (LVMS)

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-ORM-blue?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Security-Hardened-red?style=for-the-badge&logo=security" alt="Security" />
</div>

<br />

The **Loan Verification Management System (LVMS)** is an enterprise-grade platform built to streamline and manage the end-to-end verification process for financial institutions. It features a robust **Monolithic Architecture** separating a high-performance **Express.js API Backend** from a **Next.js 15 Client Interface**.

Designed with **Bank-Grade Security** in mind, LVMS is heavily fortified against modern web vulnerabilities, utilizing advanced rate-limiting, strict input sanitization, and secure authentication flows.

---

## 🏗️ System Design & Architecture

### Client-Server Decoupling
* **Frontend Application**: Built on Next.js 15 (App Router) using React 19. It acts purely as a presentation layer, utilizing server-side rendering (SSR) for initial load speed and client-side rendering (CSR) for highly interactive dashboards (MapLibre tracking, data tables).
* **Backend API Gateway**: A standalone Node.js/Express.js server strictly serving RESTful JSON endpoints.
* **Database Layer**: PostgreSQL database managed via Prisma ORM for robust migrations, strict typing, and query optimization.

### Core Workflows
1. **Dispatcher Workflow**: Admins upload CSV/Excel files containing verification targets. The backend parses, sanitizes, and geocodes the addresses before pushing them to the database.
2. **Agent Field Workflow**: Field officers use the progressive web app interface. They are served optimized routes and can submit verification forms along with geo-tagged photographic evidence.
3. **Offline Sync Engine**: The agent panel uses local caching. If cellular service drops, verifications are saved locally and forcefully synced to the backend once the connection is restored.

---

## 🔒 Security & Hardening Implementations

This system has been explicitly designed to mitigate top OWASP vulnerabilities:

### 1. DDoS & Brute Force Protection (Rate Limiting)
* **Global Rate Limiting**: The Express server implements strict global API rate limiters, capping standard endpoints to prevent network flooding and API abuse.
* **Targeted Throttling**: Highly sensitive endpoints (e.g., `/login`, `/forgot-password`, `/verify-otp`) utilize isolated, hyper-strict rate limits (e.g., maximum 5 attempts per 15 minutes per IP) to completely neutralize credential stuffing and brute-force password attacks.

### 2. SQL Injection (SQLi) Prevention
* **Zero Raw Queries**: The system relies entirely on the **Prisma ORM**. All database interactions are inherently parameterized and strictly typed by TypeScript schemas, making traditional SQL Injection mathematically impossible.

### 3. Cross-Site Scripting (XSS) Mitigation
* **React DOM Escaping**: By utilizing Next.js/React for the frontend, all dynamic data variables injected into the DOM are inherently escaped, mitigating Reflected and Stored XSS.
* **Strict Payload Validation**: Every single incoming backend request payload is parsed and validated using **Zod**. If an input does not strictly match the expected data shape, type, and length constraints, the request is instantly rejected (400 Bad Request) before hitting the controllers.

### 4. Cross-Site Request Forgery (CSRF) & Authentication
* **Stateless JWT Flow**: Sessions are managed via mathematically signed JSON Web Tokens (JWT).
* **HttpOnly Cookies**: Tokens are never exposed to `localStorage` or JavaScript scope. They are securely transported via `HttpOnly`, `Secure`, and `SameSite=Strict` cookies, rendering CSRF and Token-Theft XSS attacks ineffective.

---

## ✨ Application Features

### 👨‍💼 Admin Dashboard
* **Agent Management**: Register, track, and manage field verification agents.
* **Case Assignment**: Assign business and residential verification cases to agents.
* **Live GPS Tracking**: Monitor agent locations in real-time on interactive MapLibre maps.
* **Data Import/Export**: Bulk upload cases via Excel/CSV.
* **Dark Mode**: Fully implemented responsive light/dark theme toggle.

### 🕵️‍♂️ Agent Panel
* **Optimized Routing**: View assigned cases optimized for distance and time.
* **Offline Mode**: Continue capturing verification data and photos even without cellular service.
* **Location Ping**: Background GPS tracking pinged to the backend.
* **Secure OTP Flow**: Reset passwords securely using 6-digit email-based OTPs (powered by Resend API).

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* A PostgreSQL database instance
* A Resend API key for email delivery

### 1. Backend Setup
Navigate to the server directory, install dependencies, and configure environment variables:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/lvms?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
RESEND_API_KEY="re_your_resend_api_key_here"
```

Initialize the database schema and start the server:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

### 2. Frontend Setup
In a new terminal, navigate to the root directory and start the Next.js client:

```bash
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API will run on `http://localhost:5000`.

---

## 📜 License
This project is licensed under the MIT License. You are free to use, modify, and distribute the code for both commercial and non-commercial purposes.
