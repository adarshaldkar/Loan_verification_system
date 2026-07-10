# Multi-Tenant Admin Hierarchy

You correctly pointed out that the application currently displays global data to all Admins. You want a multi-tenant hierarchy where an Admin only manages their own specific set of Agents, Customers, and Cases. This way, every Admin gets their own isolated panel.

## User Review Required

> [!WARNING]
> This requires adding a new `adminId` column to multiple database tables to establish ownership. This will involve generating a new Prisma migration and resetting the database. **Current data will be cleared** during the migration. Is this acceptable?

## Open Questions

> [!IMPORTANT]
> 1. **Super Admin Role:** Do we need a "Super Admin" role that can still see everything across all Admins? Or are all Admins completely isolated? (I'll build them isolated by default unless you say otherwise).
> 2. **Adding Agents:** Currently, there's no UI form to "Add an Agent" (it seems they might be seeded or created elsewhere). I will ensure that any newly created Agent is tied to the Admin that creates them, but I need to make sure you have a way to create them. Do you want me to build an "Add Agent" modal/page if one doesn't exist?

## Proposed Changes

### Database Schema Updates

#### [MODIFY] [schema.prisma](file:///c:/Users/shrut/Desktop/Loan_verification_system/server/prisma/schema.prisma)
Add a self-relation on `User` to link Agents to an Admin.
Add `adminId` to `Customer` and `VerificationCase` to isolate data.
```prisma
model User {
  // ... existing fields ...
  
  // Multi-tenant Hierarchy
  adminId     String?
  admin       User?    @relation("AdminAgents", fields: [adminId], references: [id])
  agents      User[]   @relation("AdminAgents")

  assignedCases VerificationCase[] @relation("AgentCases")
  adminCases    VerificationCase[] @relation("AdminCases")
  customers     Customer[]
}

model Customer {
  // ... existing fields ...
  adminId String?
  admin   User?   @relation(fields: [adminId], references: [id])
}

model VerificationCase {
  // ... existing fields ...
  adminId String?
  admin   User?   @relation("AdminCases", fields: [adminId], references: [id])
}
```

### Backend Controller Updates

For each controller, we will scope the database queries using `where: { adminId: req.user.id }` so Admins can only see data that belongs to them.

#### [MODIFY] [dashboardController.ts](file:///c:/Users/shrut/Desktop/Loan_verification_system/server/src/controllers/admin/dashboardController.ts)
- Update `getDashboard` and `getAnalytics` to only count and return data where `adminId: req.user.id`.

#### [MODIFY] [agentController.ts](file:///c:/Users/shrut/Desktop/Loan_verification_system/server/src/controllers/admin/agentController.ts)
- Update `getAgents` to fetch `User` where `adminId: req.user.id`.

#### [MODIFY] [caseController.ts](file:///c:/Users/shrut/Desktop/Loan_verification_system/server/src/controllers/admin/caseController.ts)
- Update `getCases` to fetch `VerificationCase` where `adminId: req.user.id`.

### Frontend Updates

#### [MODIFY] [page.tsx (Dashboard)](file:///c:/Users/shrut/Desktop/Loan_verification_system/app/app/page.tsx)
- Fetch the admin's profile and replace the hardcoded "Welcome back, Rohit!" with the dynamically loaded `Welcome back, {profile.name}!`.

## Verification Plan

### Automated Tests
- Run `npx prisma db push` to sync the new schema to the database.
- Run `tsc` to verify no type errors were introduced by the Prisma schema changes.

### Manual Verification
- Register a new Admin ("Admin A") and create an Agent/Case for them.
- Register a second Admin ("Admin B") and verify that their dashboard is completely empty and isolated from Admin A's data.
