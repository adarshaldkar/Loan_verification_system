# 🛵 Agent Live Tracking, Mileage Odometer & Fuel Reimbursement System
## Architecture & Implementation Specification

---

## 1. Executive Summary
This document outlines the architectural blueprint and dynamic implementation for field agent tracking, daily odometer distance calculation, and fuel expense reimbursement in the Loan Verification Management System (LVMS).

Inspired by mobility & delivery platforms (**Rapido**, **Swiggy**, **Zomato**), the system enables:
1. **Reliable Live Agent Tracking:** Real-time location visualization on MapLibre GL with bike icons, movement states (`MOVING`, `ON_SITE`, `IDLE`), and breadcrumb route polylines.
2. **Session Persistence & Recovery:** Automatic restoration of active rides upon agent browser refresh or network reconnect.
3. **High-Precision Mileage Odometer:** Anti-fraud GPS filtering (accuracy bounds, impossible jump/teleportation detection) and non-lossy distance accumulation.
4. **Dynamic Fuel Reimbursement:** Company-configurable reimbursement rate (₹/km), per-trip & daily fuel calculations, admin approval workflows, and Excel export for accounting.

---

## 2. System Architecture

```
┌─────────────────────────────────┐           ┌───────────────────────────────────┐
│     Agent Mobile / Web App      │           │      Admin Live Operations Map    │
│  - Background WakeLock          │           │  - Rapido/Swiggy Bike Markers     │
│  - 10s Telemetry Pings (GPS)    │           │  - Live Trail Polylines           │
│  - Active Ride Auto-Restore     │           │  - Telemetry Pill & Fuel Odometer │
└────────────────┬────────────────┘           └─────────────────▲─────────────────┘
                 │ POST /api/agent/rides/ping                   │ GET /api/admin/tracking/active
                 ▼                                              │
┌───────────────────────────────────────────────────────────────┴─────────────────┐
│                               Express 5 API Gateway                             │
│  - pingLimiter (Per-Agent Rate Limiting, avoiding shared IP throttle)            │
│  - Validation: Lat (-90..90), Lng (-180..180), Accuracy (<100m)                 │
│  - Anomaly Filter: Inferred Speed > 120 km/h flagged                             │
└────────────────┬───────────────────────────────┬────────────────────────────────┘
                 │ Cache Latest Coordinate       │ Persist Anchors & Distances
                 ▼                               ▼
       ┌──────────────────┐           ┌────────────────────────┐
       │   Redis Store    │           │  Neon PostgreSQL (DB)  │
       │ - ride:latest    │           │ - AgentRide            │
       │ - ride:data      │           │ - AgentLocation        │
       │ - ride:anchor    │           │ - TripSegment          │
       │ - In-Memory Fall │           │ - SystemSetting        │
       └──────────────────┘           └────────────────────────┘
```

---

## 3. Database Schema Updates

### 3.1 `AgentRide`
- `fuelRatePerKm`: Float (default `3.5`)
- `fuelCost`: Float (default `0.0`)
- `reimbursementStatus`: String (`PENDING`, `APPROVED`, `REJECTED`, default `PENDING`)
- `claimedAmount`: Float?
- `approvedAmount`: Float?
- `approvedAt`: DateTime?
- `approvedBy`: String?
- `notes`: String?

### 3.2 `AgentLocation`
- `accuracy`: Float? (device GPS accuracy in meters)
- `isAnomaly`: Boolean (default `false`)
- `anomalyReason`: String?

### 3.3 `TripSegment` (New Model)
- `id`: UUID (Primary Key)
- `rideId`: String (references `AgentRide`)
- `agentId`: String
- `caseId`: String? (associated verification case)
- `fromAddress`: String?
- `toAddress`: String?
- `startLat`: Float
- `startLng`: Float
- `endLat`: Float?
- `endLng`: Float?
- `distanceKm`: Float (default `0`)
- `fuelCost`: Float (default `0`)
- `startTime`: DateTime (default `now()`)
- `endTime`: DateTime?
- `status`: String (`IN_PROGRESS`, `COMPLETED`)

### 3.4 `SystemSetting`
- `fuelRatePerKm`: Float (default `3.5`)

---

## 4. Anti-Fraud & Mileage Accumulation Logic

1. **Accuracy Threshold:** If GPS accuracy > 100m, log point with low-confidence flag and do not advance distance anchor.
2. **Implausible Speed Filter:**
   Inferred speed = (delta distance / delta time) * 3600.
   If inferred speed > 120 km/h, flag as GPS anomaly and do not add to reimbursable mileage.
3. **Accumulator Anchor Model:**
   Instead of wiping sub-10m movements in Redis, maintain an accepted `distanceAnchor`. Only advance `distanceAnchor` and increment `totalDistance` when the cumulative delta from the anchor reaches >= 15 meters.
4. **Session Recovery:**
   `GET /api/agent/rides/current` returns any ride in `STARTED` status for the authenticated agent, restoring duration timer, distance, and ping loop on page reload.

---

## 5. End-to-End Implementation Milestones

- [ ] **Milestone 1:** Database Schema & Migration (`schema.prisma`)
- [ ] **Milestone 2:** Backend Controllers & API Routes (Restore ride, hardened pings, fuel rates, reimbursement claims)
- [ ] **Milestone 3:** Frontend API Client bindings (`lib/api.ts`)
- [ ] **Milestone 4:** Agent Portal (`app/agent/page.tsx`): Active ride recovery, live fuel/KM odometer, per-case fuel estimates
- [ ] **Milestone 5:** Admin Portal (`app/app/tracking/page.tsx`): Swiggy/Rapido bike icons, live statuses, fuel reimbursement approval drawer & Excel export
