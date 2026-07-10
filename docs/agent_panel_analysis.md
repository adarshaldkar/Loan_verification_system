# Agent Panel Analysis & Full Flow Map

## What Exists in the Agent Panel (Frontend)

| Page | Route | Status |
|---|---|---|
| Dashboard | `/agent` | ✅ Exists — 100% static mock data |
| Assigned Cases List | `/agent/cases` | ✅ Exists — 100% static mock data |
| Case Detail | `/agent/cases/[id]` | ✅ Exists — static |
| Verification Process | `/agent/verify/[id]` | ✅ Exists — 48KB, very detailed |
| Notifications | `/agent/notifications` | ✅ Exists |
| Profile | `/agent/profile` | ✅ Exists |
| Login | `/agent/login` | ✅ Exists |

---

## 🔴 Critical Problem: Everything is Static Mock Data

**The entire agent panel runs on hardcoded dummy data.** Nothing is connected to the backend.

Examples found in the code:
- `agent/page.tsx` → hardcoded `initialCases` array with fake names like "Ramesh Kumar", "Vijay Enterprises"
- `agent/cases/page.tsx` → hardcoded `allCases` array with fake case IDs like "LV-2026-10821"
- Agent identity hardcoded: `const AGENT = { name: "Arun Kumar", id: "AGT-1024", initials: "AK" }`
- No API calls (`loginApi`, `getCasesApi`, etc.) anywhere in the agent panel

---

## The Complete Business Flow (Admin → Agent)

This is the end-to-end flow that needs to be built:

### Step 1: Admin Uploads Excel (Already Exists Partially)
- Admin logs into Admin Panel → goes to Upload page
- Admin uploads Excel file with customer leads (name, phone, address, loan amount)
- Backend creates `Customer` and `VerificationCase` (status: `PENDING`) records in DB

### Step 2: Admin Assigns Cases to Agents (Missing Backend + Frontend link)
- Admin goes to Cases page → sees `PENDING` cases
- Admin clicks "Assign" → selects an agent from the dropdown
- Backend updates `VerificationCase.agentId` and status becomes `ASSIGNED`
- **The agent must now see this case on their dashboard** ← This link is MISSING

### Step 3: Agent Logs In
- Agent goes to `/agent/login`
- Agent enters email and password (credentials created by Admin)
- Backend authenticates → issues HttpOnly cookie (same auth system as Admin)
- **Missing:** Agent login page has no API call — it's just a UI

### Step 4: Agent Views Assigned Cases
- Agent Dashboard → shows only cases assigned to THEM (filtered by `agentId`)
- **Missing:** Agent dashboard still shows static mock data

### Step 5: Agent Opens a Case and Does Verification
- Agent clicks a case → sees customer details, address, loan type
- Agent navigates to location, captures photos, fills verification form
- The `/agent/verify/[id]` page has a very detailed multi-step verification form (UI exists)
- **Missing:** No API call to submit the verification data back to the backend

### Step 6: Agent Submits the Case
- Agent clicks "Submit Verification"
- Backend updates `VerificationCase.status` to `SUBMITTED` or `COMPLETED`
- Audit log entry created
- Admin sees the updated status in the Admin Panel Cases page

---

## What Needs to Be Built

### Backend (New Agent API Routes)
```
POST  /api/v1/agent/login             ← Agent-specific login (same auth, different check)
GET   /api/v1/agent/dashboard         ← KPIs for this agent only
GET   /api/v1/agent/cases             ← Only cases assigned to this agent
GET   /api/v1/agent/cases/:id         ← Single case details
PATCH /api/v1/agent/cases/:id/status  ← Update status (TRAVELLING, AT_LOCATION, IN_PROGRESS)
POST  /api/v1/agent/cases/:id/submit  ← Final submission with remarks
POST  /api/v1/agent/cases/:id/photos  ← Upload verification photos
GET   /api/v1/agent/notifications     ← Agent's notifications
GET   /api/v1/agent/profile           ← Agent's own profile
```

### Frontend (Connect Agent Panel to API)
1. `agent/login/page.tsx` → call `POST /api/v1/auth/login`
2. `agent/page.tsx` → call `GET /api/v1/agent/dashboard` (replace mock data)
3. `agent/cases/page.tsx` → call `GET /api/v1/agent/cases` (replace mock data)
4. `agent/cases/[id]/page.tsx` → call `GET /api/v1/agent/cases/:id`
5. `agent/verify/[id]/page.tsx` → call `POST /api/v1/agent/cases/:id/submit`

### Missing Flow: Assign-to-Agent (Admin Side)
- The `assignCase` backend endpoint already exists ✅
- The Admin Cases page needs a working "Assign Agent" dropdown that calls it
