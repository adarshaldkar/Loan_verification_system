# Bulk Excel Upload (Case Import)

This document describes the design, implementation, and processing flow of the **Bulk Excel Upload** feature in the Loan Verification Management System (LVMS).

---

## 1. Feature Description

The bulk upload feature allows administrators to import multiple customer leads and verification cases from a spreadsheet (Excel file) rather than registering them one by one.

---

## 2. Processing Flow

1. **Frontend File Input**:
   * Located at the `/app/upload` page.
   * Admins select a `.xlsx` or `.xls` spreadsheet containing customer case rows and upload it.
2. **Backend Parsing & Validation**:
   * Processed by [`uploadController.ts`](file:///c:/Users/AKSHAYA/Desktop/LVMS/server/src/controllers/admin/uploadController.ts) via `/api/v1/admin/upload/bulk`.
   * The server parses sheets using the `xlsx` library and validates mandatory fields for each customer row.
3. **Transaction Batching**:
   * Creates an `UploadBatch` database record to track progress.
   * Inserts validation cases asynchronously in chunks, linking them to the logged-in administrator.

---

## 3. Required Excel Headers

The upload template expects the following headers (order-insensitive):

* `Application ID` (Unique lead identifier)
* `First Name` (Customer first name)
* `Last Name` (Customer last name)
* `Phone` (Customer contact number)
* `Email` (Customer email address)
* `Address` (Location to perform physical verification)
* `Loan Type` (Type of loan, e.g. `RESIDENTIAL`, `BUSINESS`)
* `Loan Amount` (Loan valuation figure)
* `Branch` (Allocated branch code/name)
