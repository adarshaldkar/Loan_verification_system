# Backend Optimization & Refactoring Strategy

*Prepared by: Senior Backend Engineering Team*

## 1. The Current Bottleneck
The current backend is operating as a Minimum Viable Product (MVP). Almost all business logic, routing, and database operations are centralized within a single file: `adminController.ts`. 

**Why this is a problem:**
- **Violation of SRP:** The Single Responsibility Principle states that a module should have one, and only one, reason to change. A "Fat Controller" breaks this rule, leading to merge conflicts and fragile code.
- **Security Risks:** Mixing Admin logic with upcoming Field Agent logic in the same router/controller space increases the risk of privilege escalation.
- **Scalability:** It is impossible to isolate performance bottlenecks (e.g., separating heavy Excel processing from lightweight dashboard queries).

---

## 2. Refactoring Process & Roadmap

To transform this MVP into the production-ready architecture defined in our System Design, we will execute the following phased approach:

### Phase 1: Security & Edge Hardening (Immediate)
Before writing new features, we must secure the existing endpoints.
- **Implement Rate Limiting:** Introduce `express-rate-limit` to prevent brute-force attacks on the `/auth/login` route and mitigate DDoS attacks across all APIs.
- **Implement Helmet:** Add `helmet` middleware to enforce strict HTTP security headers (XSS protection, MIME sniffing prevention, frameguard).
- **CORS Configuration:** Strictly define allowed origins to prevent unauthorized cross-origin requests.

### Phase 2: Controller Decomposition (The "Chop Up")
We will dismantle `adminController.ts` into a "Modular Monolith" structure based on specific entities:
1. `authController.ts`: Login, token generation.
2. `dashboardController.ts`: Analytics and KPI generation.
3. `customerController.ts`: Customer CRUD and validation.
4. `caseController.ts`: Verification case assignment and status tracking.
5. `userController.ts`: Agent and branch manager administration.
6. `uploadController.ts`: Excel bulk import logic.

*Outcome: Code becomes readable, testable, and maintainable.*

### Phase 3: Establishing the Agent Boundary
The Field Agent mobile application requires a completely separate set of APIs to guarantee security.
- Create `routes/agent.ts` with strict Agent-only JWT middleware.
- Build `controllers/agentController.ts` focused entirely on mobile app workflows:
  - `GET /agent/cases`: Fetch assigned cases.
  - `POST /agent/cases/:id/verify`: Submit GPS coordinates, photos, and form data.
- **Crucial Rule:** The Agent API must never trust client input. We will use `Zod` to validate all incoming data payloads before they hit the database.

### Phase 4: Asynchronous Processing (Performance Tuning)
Moving heavy workloads off the main Node.js event loop.
- **Excel Uploads:** Processing 10,000 rows in an HTTP request will crash the server. We will introduce **BullMQ** (backed by Redis) to process bulk uploads in the background and notify the admin via WebSockets or polling when complete.
- **Report Generation:** PDF and large CSV exports will also be moved to background workers.

### Phase 5: Database & Caching Optimization
- **Redis Caching:** Cache the Dashboard KPIs (`GET /admin/dashboard`) with a 5-minute TTL to drastically reduce the load on the PostgreSQL database during peak operational hours.
- **Query Optimization:** Review Prisma queries to ensure we are selecting only necessary fields, utilizing pagination, and leveraging database indexes on high-traffic fields (like `case.status` and `customer.applicationId`).

---

## Conclusion
By executing this optimization plan, the backend will shift from a fragile script to a resilient, scalable, and banking-grade service capable of supporting thousands of field agents concurrently.
