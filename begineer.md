# Loan Verification Management System - Architecture Plan

This document outlines the system design, technology stack, and folder structure for our **Loan Verification Management System**, based on the provided architecture document.

## 🏛️ System Overview

The platform will consist of a central backend supporting three distinct interfaces:
1. **Admin Web Panel**: For managing cases, uploading customer data (Excel), and reviewing verification reports.
2. **Field Verification Agent (Mobile App)**: For agents to receive cases, navigate via GPS, capture geo-tagged photos, and submit verification forms.
3. **Monitoring Panel**: For tracking system health, logs, and API status.

## 🛠️ Technology Stack & Decisions

Based on the documentation and our discussion, here is the finalized stack:
- **Backend (Server)**: Node.js, TypeScript, Express.js
- **Frontend (Client)**: Next.js 15, React 19, Tailwind CSS (Existing)
- **Mobile App**: React Native (Expo)
- **Database**: PostgreSQL
- **ORM**: Prisma ORM
- **Queue/Async**: BullMQ with Redis
- **File Storage**: AWS S3 (for photos and documents)

---

## ❓ Open Questions & Discussion (REST vs GraphQL)

You asked whether we should use **REST API** or **GraphQL**. 

> [!TIP]
> **Recommendation: REST API**
> For this specific project, a **REST API** is the better choice. Here's why:
> 1. **File Uploads**: The system relies heavily on uploading geo-tagged photos and Excel files. REST handles multipart file uploads natively and much easier than GraphQL.
> 2. **Clear Boundaries**: The services defined in the architecture (Auth, User, Customer, Verification, Media, Report) map perfectly to standard REST endpoints (e.g., `POST /api/verification`, `GET /api/customers`).
> 3. **Caching**: We will use Redis for caching. REST API responses are much easier to cache at the HTTP level (API Gateway/CDN) than GraphQL queries.
> 4. **Mobile App Integration**: Mobile apps dealing with offline sync and photo uploads generally integrate more predictably with REST endpoints.

You also mentioned **Prisma ORM with a SQL Database**. This is a **perfect** choice. PostgreSQL guarantees the ACID compliance needed for financial verification data, and Prisma provides excellent type safety with TypeScript.

---

## 📁 Proposed Folder Structure

To keep things clean as requested, we will use a `client` and `server` structure at the root of the project.

```text
Loan_verification_system/
├── client/                     # (Existing Next.js Admin Panel)
│   ├── app/
│   ├── components/
│   └── public/
└── server/                     # (New Node.js/Express Backend)
    ├── src/
    │   ├── config/             # Environment, Database connections
    │   ├── controllers/        # Route handlers (Auth, Verification, etc.)
    │   ├── middlewares/        # Auth (JWT), Validation (Zod), Error Handling
    │   ├── models/             # Prisma Schema
    │   ├── routes/             # Express API Routes
    │   ├── services/           # Business Logic (e.g., Maps integration)
    │   ├── utils/              # Helpers (GPS calculation, formatting)
    │   └── index.ts            # Entry point
    ├── prisma/
    │   └── schema.prisma       # Database Schema definitions
    ├── package.json
    └── tsconfig.json
```

## 🚀 Proposed Changes (Next Steps)

When you are ready to proceed with coding, I will execute the following steps:

1. **Restructure**: Move the existing Next.js frontend code into a `client/` folder.
2. **Initialize Backend**: Create the `server/` folder and initialize Node.js with TypeScript and Express.
3. **Database Setup**: Install and initialize Prisma, and draft the initial `schema.prisma` for `Users`, `Customers`, and `Verifications`.
4. **Core Configuration**: Setup standard middlewares like CORS, Helmet (Security), and error handling.

> [!IMPORTANT]
> **User Review Required**
> We are currently in discussion mode. Please review this architecture plan. Let me know if you agree with using **REST API**, and if you approve of the **client/server** folder structure. 
> 
> **Click "Proceed" or reply when you want me to start writing the code!**
