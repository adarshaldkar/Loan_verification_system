# Comprehensive Verification Profiles Specification & Implementation Architecture

This document defines the 12 custom verification questionnaire profiles required for field operations, their exact fields, and how they integrate seamlessly across the Agent Verification Portal and the Admin Review Management Dashboard.

---

## 1. Summary of 12 Verification Profiles

1. **RESIDENTIAL PROFILE (`RESIDENTIAL`)**
   - Focus: Home verification, address traceability, living status (owned/rented), family structure, earning members, neighbor check.
2. **BUSINESS PROFILE (`BUSINESS`)**
   - Focus: Commercial entity verification, setup & activity sighting, stock valuation, staff availability, business proofs (GST/Udyam).
3. **RESIDENTIAL CUM BUSINESS PROFILE (`RESI_CUM_BUSINESS`)**
   - Focus: Dual-purpose residential premises operating a business from home.
4. **OFFICE AND PAY SLIP PROFILE (`OFFICE_PAYSLIP`)**
   - Focus: Salaried employment verification, employer credentials, HR confirmation, salary certificate/payslip validation, salary mode (Bank/Cash).
5. **RESIDENTIAL PROFILE FOR AGRICULTURE (`AGRICULTURE`)**
   - Focus: Rural/agricultural land verification, crop types, land ownership, irrigation source (Borewell/Well), motor HP, livestock, farm machinery, agri income.
6. **DEALERS VERIFICATION - BUSINESS PROFILE (`DEALERS`)**
   - Focus: Dealer trade operations, showroom/warehouse setup, dealer ID card, bank account & IFSC credentials, business proofs.
7. **RESIDENTIAL PROFILE FOR DSA (`DSA_RESIDENTIAL`)**
   - Focus: Direct Selling Agent residence inspection, personal background, loan portfolio handled (HL, BL, PL), and bank associations.
8. **BUSINESS PROFILE FOR DSA (`DSA_BUSINESS`)**
   - Focus: DSA office infrastructure (Computers, Printers, Internet connectivity, Staff), partner bank tie-ups, loan volumes.
9. **RESI CUM BUSINESS PROFILE FOR DSA (`DSA_RESI_CUM_BUSINESS`)**
   - Focus: Combined home-office DSA loan distribution setup.
10. **CD LOAN ASSET VERIFICATION PROFILE (`CD_LOAN_ASSET`)**
    - Focus: Consumer Durable asset inspection, applicant personal usage vs gifted/resold check, down payment, loan amount, and monthly EMI.
11. **PROPERTY PROFILE (`PROPERTY`)**
    - Focus: Real estate plot/site survey, construction stage, materials on site, 4 boundary survey (Left, Right, Front, Back), per sqft valuation, legal/dispute checks.
12. **SELLER PROFILE (`SELLER`)**
    - Focus: Property seller verification, transaction value, advance token amount, buyer-seller relationship & background history.

---

## 2. Complete Field Specifications by Profile

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. RESIDENTIAL PROFILE                                                                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Applicant Name                                                                       │
│ • Address Traceable or Not (Yes / No)                                                  │
│ • Address Confirmed or Not (Yes / No)                                                  │
│ • Door No Matched or Not (Yes / No)                                                    │
│ • Met Person Name                                                                      │
│ • Met Person Relationship with Applicant                                               │
│ • Construction Type: RC / Hut / Chawl / AC Sheet                                       │
│ • Approx Sqft                                                                          │
│ • Property Owned in Whose Name                                                         │
│ • Building Type & Colour                                                               │
│ • Living Status: Rented / Owned                                                        │
│ • Rent Amount (if rented)                                                              │
│ • Years of Stay in this Home                                                           │
│ • Total Family Members                                                                 │
│ • Total Earning Persons                                                                │
│ • Family Work Details:                                                                 │
│     - Applicant: Work / No. of Years / Salary / Designation                              │
│     - Wife: Housewife or Work / No. of Years / Salary / Designation                      │
│     - Son details                                                                      │
│     - Daughter details                                                                 │
│ • Proof Sighted (Aadhaar / Voter ID / Utility Bill / None)                             │
│ • Political Link (Yes / No)                                                            │
│ • Neighbour Name and Age                                                               │
│ • Landmark                                                                             │
│ • Note                                                                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. BUSINESS PROFILE                                                                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Applicant Name                                                                       │
│ • Address Traceable or Not (Yes / No)                                                  │
│ • Address Confirmation or Not (Yes / No)                                               │
│ • Door No Matched or Not (Yes / No)                                                    │
│ • Area: Commercial / Residence / Slum                                                  │
│ • Met Person Name & Designation                                                        │
│ • Years of Doing Business                                                              │
│ • Proprietor / Partner / Director Name                                                 │
│ • Constitution: Proprietorship / Partnership / Pvt Ltd                                 │
│ • Nature of Business                                                                   │
│ • Premises: Rented / Owned                                                             │
│ • Rent Amount & Approx Sqft                                                            │
│ • Ownership in Whose Name                                                              │
│ • Visible Staff & Available Staff Count                                                │
│ • Stock Value (₹) & Monthly Income / Yearly ITR                                        │
│ • Stock Sighted (Yes / No)                                                             │
│ • Business Setup Sighted (Yes / No)                                                    │
│ • Business Activity Sighted (Yes / No)                                                 │
│ • Name Board (Yes / No)                                                                │
│ • Business Proof (GST / Shop Act / Udyam / None)                                       │
│ • Neighbour Name and Age                                                               │
│ • Landmark & Note                                                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. RESIDENTIAL CUM BUSINESS PROFILE                                                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Applicant Name, Address Traceable / Confirmed / Door No Matched                      │
│ • Area: Commercial / Residence / Slum                                                  │
│ • Met Person Name & Relationship                                                       │
│ • Construction Type (RC / Hut / Chawl / AC), Approx Sqft                               │
│ • Rented / Owned, Rent Amount, Years of Stay, Ownership Name                           │
│ • Family Members & Earning Members                                                     │
│ • Family Occupation Details (Applicant, Wife, Son, Daughter)                           │
│ • Proof Sighted & Political Link                                                       │
│ • Years in Business, Nature of Business                                                │
│ • Stock Value, Visible Staff, Available Staff                                          │
│ • Monthly Income / Yearly ITR                                                          │
│ • Proprietor / Partner / Director Name, Constitution                                   │
│ • Setup Sighted, Activity Sighted, Name Board, Stock Sighted, Business Proof           │
│ • Neighbour Name & Age, Landmark                                                       │
│ • Note: "Both Office and Home are the Same Address"                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 4. OFFICE AND PAY SLIP PROFILE                                                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Applicant Name                                                                       │
│ • Office Traceable or Not (Yes / No)                                                   │
│ • Office Restricted or Not (Yes / No)                                                  │
│ • Met Person Name & Designation                                                        │
│ • Applicant Working as Designation                                                     │
│ • Working for Past (Duration)                                                          │
│ • Nature of Office                                                                     │
│ • Salary (₹)                                                                           │
│ • Salary Mode: Bank Transfer / Cash                                                    │
│ • Bank Name & Bank Branch Name                                                         │
│ • Pay Slip Confirmation (Yes / No)                                                     │
│ • Authorised Sign for Pay Slip / Salary Certificate (Yes / No)                          │
│ • Total Workers / Staff Seen in Office                                                 │
│ • Office Setup and Activities (Yes / No)                                               │
│ • Name Board (Yes / No)                                                                │
│ • Who Confirmed Applicant Working (HR / Colleague / Manager)                           │
│ • If Entry Restricted: Authority Name & Contact No                                     │
│ • Landmark & Note                                                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 5. RESIDENTIAL PROFILE FOR AGRICULTURE                                                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Applicant Name, Address Traceable / Confirmed / Door No Matched                      │
│ • Met Person Name & Relationship                                                       │
│ • RC/Hut/Chawl/AC, Approx Sqft, Rented/Owned, Rent Amount, Building Type & Colour      │
│ • Years of Stay, Family & Earning Members, Family Job Details, Proof Sighted, Politics │
│ • Total Agricultural Land (Acres)                                                      │
│ • Type of Agriculture / Crops                                                          │
│ • Land in Whose Name                                                                   │
│ • Water Source: Well / Borewell / Canal                                                │
│ • HP of Motor (Horsepower)                                                             │
│ • Livestock (Goat, Cow, Buffalo count)                                                 │
│ • Farm Equipment (Tractor, Harvester if any)                                           │
│ • Agri Income (₹) & Others Secondary Income (₹)                                        │
│ • Neighbour Name & Age, Landmark, Note                                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 6. DEALERS VERIFICATION - BUSINESS PROFILE                                             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Applicant Name, Address Traceable / Confirmed / Door No Matched                      │
│ • Area: Commercial / Residence / Slum                                                  │
│ • Met Person Name & Designation                                                        │
│ • Construction Type, Sqft, Rented/Owned, Rent Amount                                   │
│ • Years of Doing Business, Nature of Business                                          │
│ • Stock Value, Visible Staff, Available Staff                                          │
│ • Monthly Income / Yearly ITR                                                          │
│ • Constitution: Proprietorship / Partnership                                           │
│ • Stock Sighted, Setup Sighted, Activities Sighted, Name Board, Business Proof         │
│ • Neighbour Name and Age, Landmark                                                     │
│ • Dealer Email ID                                                                      │
│ • ID Card (Yes / No)                                                                   │
│ • Bank and Account Details (Bank Name, Account No, IFSC Code)                          │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 7. RESIDENTIAL PROFILE FOR DSA (Direct Selling Agent)                                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Applicant Name, Address Traceable / Confirmed / Door No Matched                      │
│ • Met Person Name & Relationship                                                       │
│ • Construction Type, Sqft, Ownership Name, Building Type & Colour, Rented/Owned, Rent  │
│ • Years of Stay, Family Members, Earning Members, Family Work Details                   │
│ • Proof Sighted, Political Link                                                        │
│ • Type of Loans Handled: HL (Home Loan), BL (Business Loan), PL (Personal Loan)        │
│ • Name of Partner Banks / NBFCs                                                        │
│ • Monthly Income or Yearly ITR                                                         │
│ • Neighbour Name and Age, Landmark, Note                                               │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 8. BUSINESS PROFILE FOR DSA                                                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Applicant Name, Address Traceable / Confirmed / Door No Matched                      │
│ • Area: Commercial / Residence / Slum                                                  │
│ • Met Person Name & Designation                                                        │
│ • Construction Type, Sqft, Rented/Owned, Rent Amount, Ownership Name                   │
│ • Nature of Business, Proprietor/Partner/Director Name, Constitution, Years in Biz     │
│ • Office Infrastructure:                                                               │
│     - Computer Count (Nos)                                                             │
│     - Printer Available (Yes / No)                                                     │
│     - Internet Connection Availability (Yes / No)                                      │
│     - Visible Staff & Available Staff                                                  │
│ • Setup Sighted, Activity Sighted, Name Board, Business Proof                          │
│ • Monthly Income or Yearly ITR                                                         │
│ • Types of Loans Doing (HL, BL, PL)                                                    │
│ • Name of Partner Banks                                                                │
│ • Neighbour Name and Age, Landmark, Note                                               │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 9. RESI CUM BUSINESS PROFILE FOR DSA                                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Combined residential inspection + DSA loan distribution office infrastructure        │
│   (Computers, Printers, Internet, Staff, Bank associations, HL/BL/PL distribution).    │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 10. CD LOAN ASSET VERIFICATION PROFILE                                                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Applicant Name, Address Traceable / Confirmed / Door No Matched                      │
│ • Met Person Name & Relationship                                                       │
│ • RC/Hut/Chawl/AC, Sqft, Building Type & Colour, Rented/Owned, Rent Amount, Stay Years │
│ • Family Members, Earning Members, Family Job Details, Political Link, Proof Sighted   │
│ • Asset Sighted (Yes / No)                                                             │
│ • Asset Usage: Applicant Using Personally / Gifted / Resold                            │
│ • CD Loan Amount (₹)                                                                   │
│ • Initial Down Payment Amount Paid (₹)                                                 │
│ • Monthly EMI Amount (₹)                                                               │
│ • Neighbour Name and Age, Landmark, Note                                               │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 11. PROPERTY PROFILE (Site / Land / Real Estate)                                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Applicant / Buyer Name                                                               │
│ • Address Traceable / Confirmed / Door No Matched                                      │
│ • Met Person Name & Relationship with Applicant                                        │
│ • Under Construction or Not (Yes / No)                                                 │
│ • Construction Material Sighted (Yes / No)                                             │
│ • Staff / Labour Working (Yes / No)                                                    │
│ • Type of Property: Residential Plot / Commercial / Apartment / Individual House       │
│ • Property Total Sqft                                                                  │
│ • Per Cent / Per Sqft Estimated Value (₹)                                              │
│ • Slum Area or Not (Yes / No)                                                          │
│ • Political Link or Legal Dispute in the Property (Yes / No)                           │
│ • Owner of the Property                                                                │
│ • 4 Boundary Details:                                                                  │
│     - Left Side Boundary                                                               │
│     - Right Side Boundary                                                              │
│     - Front Side Boundary (Road Width / Facing)                                        │
│     - Back Side Boundary                                                               │
│ • Distance from Branch / Main Road (Km)                                                │
│ • Neighbour Name and Age, Landmark                                                     │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 12. SELLER PROFILE                                                                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Applicant / Buyer Name                                                               │
│ • Met Person Name & Relationship with Applicant / Buyer                                │
│ • Total Property Transaction Amount (₹)                                                │
│ • Initial / Token Advance Amount Paid (₹)                                              │
│ • Relationship Between Buyer and Seller                                                │
│ • How Does the Seller Know the Buyer (Duration & Background)                           │
│ • Distance from Branch (Km)                                                            │
│ • Note                                                                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. End-to-End System Integration

1. **Agent Verification Page (`/agent/verify` & `/agent/verify/[id]`)**:
   - Field agents select any of the 12 profile tabs or auto-load assigned cases.
   - Dynamic form rendering with GPS location tagging, camera photo captures, and offline local draft caching.
2. **Backend API (`/api/v1/agent/cases/:id/verify`)**:
   - Accepts structured JSON for any of the 12 types, storing it safely inside `VerificationCase.profileData`.
3. **Admin Verification Dashboard (`/app/verification` & `/app/cases/[id]`)**:
   - Parses the submitted `profileData` and renders clean review cards grouping fields into structured tables, maps, and photo grids.
   - Distinct color-coded badges for each profile type.
4. **Admin Customer & Bulk Upload (`/app/customers` & `/app/upload`)**:
   - Adds all 12 options in case creation modals and Excel template generators.
