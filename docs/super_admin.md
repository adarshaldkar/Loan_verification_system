# Super Admin Access Control System

This document describes the design, implementation, and policies of the **Super Admin Access Control** system in the Loan Verification Management System (LVMS).

---

## 1. Definition of Super Admin

Any administrator logging in with the following email credentials is treated as a **Super Admin**:
1. `akshaya@gmail.com`
2. `adarshaldkar@gmail.com`

*Both accounts are configured with the default test password: `zxc123`.*

---

## 2. Features & Restrictions

### A. Header Role Branding
* **Component**: [`layout.tsx`](file:///c:/Users/AKSHAYA/Desktop/LVMS/app/app/layout.tsx)
* **Behavior**: The top-right profile trigger dynamically checks the logged-in user's email. If the email matches the Super Admin list, the role label displays **Super Admin**. Otherwise, it defaults to **Admin**.

### B. "Add Admin" Option Visibility
* **Component**: [`admins/page.tsx`](file:///c:/Users/AKSHAYA/Desktop/LVMS/app/app/admins/page.tsx)
* **Behavior**: Hides the **Add Admin** action button from the layout header for normal admins. Super Admins will see the button, allowing them to open the registration dialog.

### C. Backend Level Enforcement
* **Component**: [`manageAdminsController.ts`](file:///c:/Users/AKSHAYA/Desktop/LVMS/server/src/controllers/admin/manageAdminsController.ts)
* **Behavior**: The `/api/v1/admin/admins/register` route validates the requester's identity. If the logged-in user is not a Super Admin, the request is immediately rejected with a `403 Forbidden` response:
  ```json
  { "success": false, "message": "Forbidden. Only Super Admins can register new Admins." }
  ```

### D. Auto-Seeding Seeding Routine
* **Component**: [`index.ts`](file:///c:/Users/AKSHAYA/Desktop/LVMS/server/src/index.ts)
* **Behavior**: To prevent connection timeouts or cold-start sleep states from blocking database insertions, a backoff retry seeding loop runs on startup. It automatically checks and upserts the Super Admin accounts (`akshaya@gmail.com`, `adarshaldkar@gmail.com`) and the default Normal Admin (`admin@loanverify.com`) into the PostgreSQL database.
