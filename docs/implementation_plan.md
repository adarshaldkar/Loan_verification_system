# Implementation Plan: Production Security & Monorepo Restructuring

## 1. Addressing Production Security (Why Basic JWT is not enough)
You are absolutely right to question this. A "Basic JWT" stored in `localStorage` is **not acceptable** for a production banking/loan system. If a user suffers a Cross-Site Scripting (XSS) attack, the attacker can steal the JWT and impersonate the admin or agent indefinitely.

**The Production-Grade Solution:**
- **Short-Lived Access Tokens (e.g., 15 mins):** Stored only in memory (React state).
- **Long-Lived Refresh Tokens (e.g., 7 days):** Stored strictly in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. This makes it immune to XSS attacks (JavaScript cannot read it).
- **Token Rotation & Revocation:** When a user logs out or is deactivated, their refresh token is blacklisted/revoked in the database.

## 2. The Restructuring Plan (Monorepo Architecture)
You requested moving from the current messy structure into clean, isolated folders:
- `admin_panel` -> `client`, `server`
- `agent_panel` -> `client`, `server`
- `monitoring_panel` -> `client`, `server`

**The Challenge:** If we split the backend into three separate servers, they all still need to talk to the exact same PostgreSQL database. If we copy-paste the Prisma schema into three folders, they will fall out of sync immediately.

**The Solution: A Monorepo (NPM Workspaces)**
We will restructure the project into an NPM Workspace monorepo. This allows us to have completely isolated folders, but share one central database schema package.

### Proposed Target Folder Structure

```text
Loan_verification_system/
├── packages/
│   └── database/           <-- Shared Prisma schema & generated client
├── apps/
│   ├── admin_panel/
│   │   ├── client/         <-- Next.js Admin App (current frontend)
│   │   └── server/         <-- Express Admin API (current backend)
│   ├── agent_panel/
│   │   ├── client/         <-- Next.js/React Native Agent App
│   │   └── server/         <-- Express Agent API
│   └── monitoring_panel/
│       ├── client/         <-- Next.js Monitoring App
│       └── server/         <-- Express Monitoring API
└── package.json            <-- Root monorepo config
```

### Proposed Changes

#### Step 1: Initialize Monorepo
- Create the root folder structure (`apps/`, `packages/`).
- Initialize NPM workspaces in the root `package.json`.

#### Step 2: Extract the Shared Database Package
- Move the `server/prisma` folder into `packages/database`.
- Create an internal NPM package `@lvms/database` that all three servers can import to run database queries safely.

#### Step 3: Migrate Admin Panel
- Move the current Next.js application into `apps/admin_panel/client`.
- Extract the `adminController` and `admin` routes from the current monolithic server into `apps/admin_panel/server`.

#### Step 4: Setup Agent & Monitoring Shells
- Scaffold `apps/agent_panel/client` and `apps/agent_panel/server`.
- Scaffold `apps/monitoring_panel/client` and `apps/monitoring_panel/server`.

#### Step 5: Implement Production Auth
- Rewrite the `authController` in the servers to issue `HttpOnly` cookies for Refresh Tokens.
- Update the client-side `api.ts` `axios` interceptors to handle silent token refreshes via cookies automatically.

> [!WARNING]
> **User Review Required**
> This is a massive architectural shift. It will require moving every file in your project. The application will be temporarily un-runnable while we physically move the folders around.
>
> **Questions for you before we begin:**
> 1. Do you approve of using **NPM Workspaces** to share the database logic between the 3 servers? (This is the industry standard for the folder structure you requested).
> 2. You mentioned the Agent frontend is ready. Is it built in Next.js (web) or React Native (mobile app)?

## Verification Plan
1. Ensure `npm install` at the root successfully installs dependencies for all clients and servers simultaneously.
2. Verify we can start the Admin client and server using a workspace script.
3. Test the new `HttpOnly` cookie authentication flow via Postman and the browser network tab to prove XSS immunity.
