export interface ProfileField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "radio" | "textarea" | "date";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string;
  helpText?: string;
}

export interface ProfileSection {
  title: string;
  description?: string;
  fields: ProfileField[];
}

export interface VerificationProfileConfig {
  id: string;
  code: string;
  name: string;
  category: "Residential" | "Business" | "Commercial" | "DSA" | "Property" | "Asset";
  description: string;
  badgeColor: string;
  sections: ProfileSection[];
}

const YES_NO_OPTIONS = ["Yes", "No"];
const TRACEABLE_OPTIONS = ["Traceable", "Not Traceable"];
const CONFIRMED_OPTIONS = ["Confirmed", "Not Confirmed"];
const MATCHED_OPTIONS = ["Matched", "Not Matched"];
const SIGHTED_OPTIONS = ["Sighted", "Not Sighted"];
const OWNED_RENTED_OPTIONS = ["Own", "Rented", "Leased", "Family Owned"];
const AREA_TYPE_OPTIONS = ["Commercial", "Residence", "Slum", "Semi-Commercial"];
const CONSTRUCTION_TYPES = ["RC (RCC Building)", "Hut", "Chawl", "AC Sheet", "Tiled / Traditional"];
const CONSTITUTION_TYPES = ["Proprietorship", "Partnership", "Private Limited", "Director / LLP", "Individual / Unregistered"];
const SALARY_MODE_OPTIONS = ["Bank Transfer", "Cash", "Cheque"];
const LOAN_TYPES_DSA = ["HL (Home Loan)", "BL (Business Loan)", "PL (Personal Loan)", "HL + BL + PL (All Loans)", "Mortgage / LAP"];
const ASSET_USAGE_OPTIONS = ["Applicant Using Personally", "Gifted to Family / Friend", "Resold / Transferred", "Commercial Use"];
const PROPERTY_TYPES = ["Residential Plot / Site", "Individual House / Villa", "Apartment / Flat", "Commercial Property", "Agricultural Land"];

export const VERIFICATION_PROFILES: VerificationProfileConfig[] = [
  /* ─────────────────────────────────────────────────────────────
     1. RESIDENTIAL PROFILE
  ───────────────────────────────────────────────────────────── */
  {
    id: "residential",
    code: "RESIDENTIAL",
    name: "Residential Profile",
    category: "Residential",
    description: "Standard home & residential address verification questionnaire.",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    sections: [
      {
        title: "1. Address & Meeting Confirmation",
        fields: [
          { name: "applicantName", label: "Applicant Name", type: "text", placeholder: "Full applicant name", required: true },
          { name: "addressTraceable", label: "Address Traceable or Not", type: "select", options: TRACEABLE_OPTIONS, required: true },
          { name: "addressConfirmed", label: "Address Confirmed or Not", type: "select", options: CONFIRMED_OPTIONS, required: true },
          { name: "doorNoMatched", label: "Door No Matched or Not", type: "select", options: MATCHED_OPTIONS, required: true },
          { name: "metPersonName", label: "Met Person Name", type: "text", placeholder: "Name of person met", required: true },
          { name: "metPersonRelationship", label: "Met Person Relationship with Applicant", type: "text", placeholder: "e.g., Self, Father, Spouse, Brother", required: true },
        ],
      },
      {
        title: "2. House & Living Details",
        fields: [
          { name: "constructionType", label: "Construction Type (Rc/hut/chawl/ac)", type: "select", options: CONSTRUCTION_TYPES, required: true },
          { name: "sqft", label: "Approx Sqft", type: "number", placeholder: "e.g., 850" },
          { name: "ownershipName", label: "Own who's Name", type: "text", placeholder: "Name of property owner" },
          { name: "buildingTypeColour", label: "Building Type and Colour", type: "text", placeholder: "e.g., 2-Storey Blue & White House" },
          { name: "rentedOrOwn", label: "Rented / Own", type: "select", options: OWNED_RENTED_OPTIONS, required: true },
          { name: "rentAmount", label: "Rent Amount (if rented)", type: "number", placeholder: "e.g., 8000" },
          { name: "yearsStayed", label: "Years of Stayed in this Home", type: "number", placeholder: "e.g., 5", required: true },
        ],
      },
      {
        title: "3. Family & Employment Assessment",
        fields: [
          { name: "totalFamilyMembers", label: "Total Family Members", type: "number", placeholder: "e.g., 4", required: true },
          { name: "earningPersons", label: "Earning Persons Count", type: "number", placeholder: "e.g., 2", required: true },
          { name: "applicantWorkDetails", label: "Applicant (Work / No. Years / Salary / Designation)", type: "text", placeholder: "e.g., Senior Tech / 4 yrs / ₹45,000 / Lead", required: true },
          { name: "wifeWorkDetails", label: "Wife (HW or Work / No. Years / Salary / Designation)", type: "text", placeholder: "e.g., Housewife OR Teacher / 3 yrs / ₹25,000" },
          { name: "sonDetails", label: "Son Details (Age / Study / Work)", type: "text", placeholder: "e.g., 14 yrs, 9th standard" },
          { name: "daughterDetails", label: "Daughter Details (Age / Study / Work)", type: "text", placeholder: "e.g., 10 yrs, 5th standard" },
        ],
      },
      {
        title: "4. Verification Sighting & Neighbor Check",
        fields: [
          { name: "proofSighted", label: "Proof Sighted", type: "text", placeholder: "e.g., Aadhaar Card, Electricity Bill, EB Card", required: true },
          { name: "politicalLink", label: "Political Link (Yes/No)", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "neighbourNameAge", label: "Neighbour Name and Age", type: "text", placeholder: "e.g., Ramesh Kumar, 45 yrs", required: true },
          { name: "landmark", label: "Landmark", type: "text", placeholder: "e.g., Near Ganesha Temple / Behind SBI Bank", required: true },
          { name: "note", label: "Notes / General Remarks", type: "textarea", placeholder: "Any additional observations from field visit..." },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     2. BUSINESS PROFILE
  ───────────────────────────────────────────────────────────── */
  {
    id: "business",
    code: "BUSINESS",
    name: "Business Profile",
    category: "Business",
    description: "Verification of enterprise setup, trade activity, stocks, and business legitimacy.",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    sections: [
      {
        title: "1. Business Identity & Location",
        fields: [
          { name: "applicantName", label: "Applicant Name", type: "text", placeholder: "Full applicant name", required: true },
          { name: "addressTraceable", label: "Address Traceable or Not", type: "select", options: TRACEABLE_OPTIONS, required: true },
          { name: "addressConfirmed", label: "Address Confirmation or Not", type: "select", options: CONFIRMED_OPTIONS, required: true },
          { name: "doorNoMatched", label: "Door No Matched or Not", type: "select", options: MATCHED_OPTIONS, required: true },
          { name: "areaType", label: "Area (Commercial / Residence / Slum)", type: "select", options: AREA_TYPE_OPTIONS, required: true },
          { name: "metPersonName", label: "Met Person Name", type: "text", placeholder: "Name of person met", required: true },
          { name: "metPersonDesignation", label: "Met Person Designation", type: "text", placeholder: "e.g., Proprietor, Manager, Accountant", required: true },
        ],
      },
      {
        title: "2. Business Entity & Premises",
        fields: [
          { name: "yearsOfBusiness", label: "Years of Doing Business", type: "number", placeholder: "e.g., 7", required: true },
          { name: "proprietorDirectorName", label: "Proprietor / Partner / Director Name", type: "text", placeholder: "Full name of legal owner", required: true },
          { name: "constitution", label: "Proprietaryship or Partnership / Pvt Ltd", type: "select", options: CONSTITUTION_TYPES, required: true },
          { name: "natureOfBusiness", label: "Nature of Business", type: "text", placeholder: "e.g., Wholesale Groceries, Textile Retail, Hardware Store", required: true },
          { name: "rentedOrOwn", label: "Rented / Own", type: "select", options: OWNED_RENTED_OPTIONS, required: true },
          { name: "rentAmount", label: "Rent Amount (if rented)", type: "number", placeholder: "e.g., 20000" },
          { name: "sqft", label: "Approx Sqft", type: "number", placeholder: "e.g., 600" },
          { name: "ownershipName", label: "Own who's Name", type: "text", placeholder: "Name of premise owner" },
        ],
      },
      {
        title: "3. Operational Capacity & Financials",
        fields: [
          { name: "visibleStaff", label: "Visible Staff Count", type: "number", placeholder: "Staff seen during visit", required: true },
          { name: "availableStaff", label: "Available Staff (Total on Payroll)", type: "number", placeholder: "Total employees", required: true },
          { name: "stockValue", label: "Approx Stock Value (₹)", type: "number", placeholder: "e.g., 500000" },
          { name: "incomeOrItr", label: "Month Income or Yearly ITR", type: "text", placeholder: "e.g., ₹85,000/month or ₹12,00,000 ITR", required: true },
        ],
      },
      {
        title: "4. Physical Verification Checklist",
        fields: [
          { name: "stockSighted", label: "Stock Sighted (Yes / No)", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "businessSetupSighted", label: "Business Setup Sighted (Yes / No)", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "businessActivitySighted", label: "Business Activity Sighted (Yes / No)", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "nameBoardSighted", label: "Name Board (Yes / No)", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "businessProof", label: "Business Proof Produced", type: "text", placeholder: "e.g., GST Certificate, Shop & Est. License, Udyam", required: true },
          { name: "neighbourNameAge", label: "Neighbour Name and Age", type: "text", placeholder: "e.g., Suresh, 50 yrs", required: true },
          { name: "landmark", label: "Landmark", type: "text", placeholder: "e.g., Opposite Central Bus Stand", required: true },
          { name: "note", label: "Notes / General Remarks", type: "textarea", placeholder: "Any specific notes regarding business viability..." },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     3. RESIDENTIAL CUM BUSINESS PROFILE
  ───────────────────────────────────────────────────────────── */
  {
    id: "resi_cum_business",
    code: "RESI_CUM_BUSINESS",
    name: "Residential Cum Business Profile",
    category: "Commercial",
    description: "Inspection of home-based enterprises and dual-purpose residential-commercial units.",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    sections: [
      {
        title: "1. Premise & Contact Verification",
        fields: [
          { name: "applicantName", label: "Applicant Name", type: "text", placeholder: "Full applicant name", required: true },
          { name: "addressTraceable", label: "Address Traceable or Not", type: "select", options: TRACEABLE_OPTIONS, required: true },
          { name: "addressConfirmed", label: "Address Confirmation or Not", type: "select", options: CONFIRMED_OPTIONS, required: true },
          { name: "doorNoMatched", label: "Door No Matched or Not", type: "select", options: MATCHED_OPTIONS, required: true },
          { name: "areaType", label: "Area - Commercial/Residence/Slum", type: "select", options: AREA_TYPE_OPTIONS, required: true },
          { name: "metPerson", label: "Met Person", type: "text", placeholder: "Name of person met", required: true },
          { name: "metPersonRelationship", label: "Met Person Relationship with Applicant", type: "text", placeholder: "e.g., Self, Wife, Partner", required: true },
        ],
      },
      {
        title: "2. Residential Infrastructure & Family",
        fields: [
          { name: "constructionType", label: "Rc/hut/chel/ac", type: "select", options: CONSTRUCTION_TYPES, required: true },
          { name: "sqft", label: "Total Approx Sqft", type: "number", placeholder: "e.g., 1200", required: true },
          { name: "rentedOrOwn", label: "Rented / Own", type: "select", options: OWNED_RENTED_OPTIONS, required: true },
          { name: "rentAmount", label: "Rent Amount (if rented)", type: "number", placeholder: "e.g., 15000" },
          { name: "yearsStayed", label: "Yrs Of Stayed in this Home", type: "number", placeholder: "e.g., 6", required: true },
          { name: "ownershipName", label: "Own who's Name", type: "text", placeholder: "Name of owner" },
          { name: "familyMembers", label: "Family Members Count", type: "number", placeholder: "e.g., 5", required: true },
          { name: "earningPersons", label: "No of Earning Person", type: "number", placeholder: "e.g., 2", required: true },
          { name: "applicantWork", label: "Applicant (work / no years / salary / Designation)", type: "text", placeholder: "e.g., Business Owner / 6 yrs / ₹60,000 / Prop", required: true },
          { name: "wifeWork", label: "Wife (hw or work / no yrs / salary / Designation)", type: "text", placeholder: "e.g., Assists in Business / 4 yrs" },
          { name: "sonDetails", label: "Son", type: "text", placeholder: "Age / Study / Work" },
          { name: "daughterDetails", label: "Daughter", type: "text", placeholder: "Age / Study / Work" },
          { name: "proofSighted", label: "Proof Sighted", type: "text", placeholder: "Aadhaar, Voter ID, EB card", required: true },
          { name: "politicalLink", label: "Any Political Link", type: "select", options: YES_NO_OPTIONS, required: true },
        ],
      },
      {
        title: "3. Business Activity within Home",
        fields: [
          { name: "yearsInBusiness", label: "Year of Doing Business", type: "number", placeholder: "e.g., 5", required: true },
          { name: "natureOfBusiness", label: "Nature of Business", type: "text", placeholder: "e.g., Tailoring & Boutique, Home Bakery, Electronics Repair", required: true },
          { name: "stockValue", label: "Stock Value (₹)", type: "number", placeholder: "e.g., 150000" },
          { name: "visibleStaff", label: "Visible Staff", type: "number", placeholder: "e.g., 2" },
          { name: "availableStaff", label: "Available Staff", type: "number", placeholder: "e.g., 3" },
          { name: "monthlyIncomeItr", label: "Month income or Yearly itr", type: "text", placeholder: "e.g., ₹50,000/mo", required: true },
          { name: "proprietorPartnerName", label: "Proprietor/Partner/Director Name", type: "text", placeholder: "Owner name", required: true },
          { name: "constitution", label: "Proprietaryship or Partnerships", type: "select", options: CONSTITUTION_TYPES, required: true },
          { name: "businessSetupSighted", label: "Business Setup Sighted Yes or No", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "businessActivitySighted", label: "Business Activity Sighted Yes or No", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "nameBoardSighted", label: "Name Board Yes or No", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "stockSighted", label: "Stock Sighted Yes / No", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "businessProof", label: "Business Proof", type: "text", placeholder: "e.g., GST / Trade license / Bank statement", required: true },
          { name: "neighbourNameAge", label: "Neighbour Name and Age", type: "text", placeholder: "e.g., Murugan, 42 yrs", required: true },
          { name: "landmark", label: "Landmark", type: "text", placeholder: "e.g., Near Water Tank", required: true },
          { name: "note", label: "Note", type: "text", defaultValue: "Both Office and Home are the Same Address" },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     4. OFFICE AND PAY SLIP PROFILE
  ───────────────────────────────────────────────────────────── */
  {
    id: "office_payslip",
    code: "OFFICE_PAYSLIP",
    name: "Office & Pay Slip Profile",
    category: "Commercial",
    description: "Corporate employer, salaried status, payslip verification, and HR confirmation.",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    sections: [
      {
        title: "1. Office Location & Meeting",
        fields: [
          { name: "applicantName", label: "Applicant Name", type: "text", placeholder: "Full applicant name", required: true },
          { name: "officeTraceable", label: "Office Traceble or Not", type: "select", options: TRACEABLE_OPTIONS, required: true },
          { name: "officeRestricted", label: "Office Restricted or Not", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "metPerson", label: "Met Person", type: "text", placeholder: "Name of official met", required: true },
          { name: "metPersonDesignation", label: "Met Person Designation", type: "text", placeholder: "e.g., HR Manager, Team Lead, Admin", required: true },
        ],
      },
      {
        title: "2. Job Profile & Compensation",
        fields: [
          { name: "applicantDesignation", label: "Applicant Working as Designation", type: "text", placeholder: "e.g., Senior Software Engineer", required: true },
          { name: "workingDuration", label: "Working for Past (Duration)", type: "text", placeholder: "e.g., 2 Years 4 Months", required: true },
          { name: "natureOfOffice", label: "Nature of Office", type: "text", placeholder: "e.g., IT Services, Manufacturing HQ, Hospital", required: true },
          { name: "salaryAmount", label: "Salary Amount (₹)", type: "number", placeholder: "e.g., 55000", required: true },
          { name: "salaryMode", label: "Salary Mode Bank Or Cash", type: "select", options: SALARY_MODE_OPTIONS, required: true },
          { name: "bankName", label: "Which Bank", type: "text", placeholder: "e.g., HDFC Bank", required: true },
          { name: "bankBranchName", label: "Bank Branch Name", type: "text", placeholder: "e.g., Anna Nagar Branch" },
          { name: "payslipConfirmation", label: "Pay Slip Confirmation or Not", type: "select", options: CONFIRMED_OPTIONS, required: true },
          { name: "authorisedSignOnPayslip", label: "Authorised Sign for Pay Slip or Salary Certificate", type: "select", options: YES_NO_OPTIONS, required: true },
        ],
      },
      {
        title: "3. Office Activity & HR Confirmation",
        fields: [
          { name: "howManyWorkers", label: "How many worker's worked here", type: "number", placeholder: "e.g., 40" },
          { name: "totalStaffSeen", label: "Total Staff Seen in Office", type: "number", placeholder: "e.g., 25", required: true },
          { name: "officeSetupActivity", label: "Office Setup and Activitie Yes or No", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "nameBoard", label: "Name Board Yes or No", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "whoConfirmedEmployment", label: "Who Confirmed Applicant Working", type: "text", placeholder: "e.g., HR Head - Ms. Priya", required: true },
          { name: "restrictedEntryAuthority", label: "If Entry Restricted, Applicant Authority Name and Contact No", type: "text", placeholder: "e.g., Security Chief Rao / 9876543210" },
          { name: "landmark", label: "Landmark", type: "text", placeholder: "e.g., Opposite Tech Park Gate 2", required: true },
          { name: "note", label: "Note", type: "textarea", placeholder: "Additional employment verification observations..." },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     5. RESIDENTIAL PROFILE FOR AGRICULTURE
  ───────────────────────────────────────────────────────────── */
  {
    id: "agriculture",
    code: "AGRICULTURE",
    name: "Residential Profile for Agriculture",
    category: "Residential",
    description: "Rural farmer residence, agricultural land, irrigation, livestock, and crop income.",
    badgeColor: "bg-lime-100 text-lime-800 border-lime-200",
    sections: [
      {
        title: "1. Residential Inspection",
        fields: [
          { name: "applicantName", label: "Applicant Name", type: "text", placeholder: "Full applicant name", required: true },
          { name: "addressTraceable", label: "Address Traceable or Not", type: "select", options: TRACEABLE_OPTIONS, required: true },
          { name: "addressConfirmed", label: "Address Confirmed or Not", type: "select", options: CONFIRMED_OPTIONS, required: true },
          { name: "doorNoMatched", label: "Door No Matched or Not", type: "select", options: MATCHED_OPTIONS, required: true },
          { name: "metPersonName", label: "Met Person Name", type: "text", placeholder: "Person met", required: true },
          { name: "metPersonRelationship", label: "Met Person Relationship with Applicant", type: "text", placeholder: "e.g., Self, Father", required: true },
          { name: "constructionType", label: "Rc/hut/chel/ac", type: "select", options: CONSTRUCTION_TYPES, required: true },
          { name: "sqft", label: "Sqft", type: "number", placeholder: "e.g., 900" },
          { name: "rentedOrOwn", label: "Rented / Own", type: "select", options: OWNED_RENTED_OPTIONS, required: true },
          { name: "rentAmount", label: "Rent Amount (if rented)", type: "number", placeholder: "e.g., 3000" },
          { name: "buildingTypeColour", label: "Building Type and Colour", type: "text", placeholder: "e.g., Tiled Roof Yellow House" },
          { name: "yearsStayed", label: "Years of Stayed in this Home", type: "number", placeholder: "e.g., 20", required: true },
          { name: "familyMembers", label: "Family Members", type: "number", placeholder: "e.g., 5", required: true },
          { name: "earningMembers", label: "Earning Members", type: "number", placeholder: "e.g., 3", required: true },
          { name: "applicantWork", label: "Applicant (work / no years / salary / Designation)", type: "text", placeholder: "e.g., Agriculture / 15 yrs / ₹40,000 / Farmer", required: true },
          { name: "wifeWork", label: "Wife (hw or work / no yrs / salary / Designation)", type: "text", placeholder: "e.g., Farming & HW" },
          { name: "sonDetails", label: "Son", type: "text", placeholder: "Age / Work" },
          { name: "daughterDetails", label: "Daughter", type: "text", placeholder: "Age / Work" },
          { name: "proofSighted", label: "Proof Sighted", type: "text", placeholder: "Patta / Chitta / Aadhaar", required: true },
          { name: "politicalLink", label: "Any Political Link", type: "select", options: YES_NO_OPTIONS, required: true },
        ],
      },
      {
        title: "2. Agricultural Land & Livestock Assets",
        fields: [
          { name: "acres", label: "Total Agricultural Acres", type: "number", placeholder: "e.g., 4.5", required: true },
          { name: "typeOfAgriculture", label: "Type of Agriculture / Crops", type: "text", placeholder: "e.g., Paddy, Sugarcane, Vegetables", required: true },
          { name: "landOwnershipName", label: "Land in Whos Name", type: "text", placeholder: "e.g., Self / Ancestral / Father", required: true },
          { name: "waterSource", label: "Well or Bore (Irrigation Source)", type: "text", placeholder: "e.g., 2 Borewells + Canal access", required: true },
          { name: "motorHp", label: "Hp of Motor", type: "text", placeholder: "e.g., 7.5 HP Free Agri Power", required: true },
          { name: "livestock", label: "Goat, Cow if any (Count)", type: "text", placeholder: "e.g., 4 Cows, 6 Goats" },
          { name: "tractor", label: "Tractor if any (Details)", type: "text", placeholder: "e.g., Mahindra 575 DI / None" },
          { name: "agriIncome", label: "Agri Income (Annual / Monthly ₹)", type: "text", placeholder: "e.g., ₹3,50,000 per harvest", required: true },
          { name: "othersIncome", label: "Others Secondary Income (₹)", type: "text", placeholder: "e.g., ₹80,000 milk sales" },
          { name: "neighbourNameAge", label: "Neighbour Name and Age", type: "text", placeholder: "e.g., Arumugam, 55 yrs", required: true },
          { name: "landmark", label: "Landmark", type: "text", placeholder: "e.g., Near Primary Health Centre", required: true },
          { name: "note", label: "Note", type: "textarea", placeholder: "Crops yield and soil observations..." },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     6. DEALERS VERIFICATION - BUSINESS PROFILE
  ───────────────────────────────────────────────────────────── */
  {
    id: "dealers",
    code: "DEALERS",
    name: "Dealers Verification - Business Profile",
    category: "Business",
    description: "Authorised dealer setup, trade stock, dealer ID card, and bank account validation.",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    sections: [
      {
        title: "1. Dealer Location & Identity",
        fields: [
          { name: "applicantName", label: "Applicant Name", type: "text", placeholder: "Dealer / Applicant name", required: true },
          { name: "addressTraceable", label: "Address Traceable or Not", type: "select", options: TRACEABLE_OPTIONS, required: true },
          { name: "addressConfirmed", label: "Address Confirmed or Not", type: "select", options: CONFIRMED_OPTIONS, required: true },
          { name: "doorNoMatched", label: "Door No Matched or Not", type: "select", options: MATCHED_OPTIONS, required: true },
          { name: "areaType", label: "Area - Commercial / Residence / Slum", type: "select", options: AREA_TYPE_OPTIONS, required: true },
          { name: "metPerson", label: "Met Person", type: "text", placeholder: "Person met", required: true },
          { name: "metPersonDesignation", label: "Met Person Designation", type: "text", placeholder: "e.g., Dealer Owner / Franchise Head", required: true },
        ],
      },
      {
        title: "2. Dealership Premises & Trade",
        fields: [
          { name: "constructionType", label: "Rc/hut/chel/ac", type: "select", options: CONSTRUCTION_TYPES, required: true },
          { name: "sqft", label: "Sqft", type: "number", placeholder: "e.g., 1500", required: true },
          { name: "rentedOrOwn", label: "Rented / Own", type: "select", options: OWNED_RENTED_OPTIONS, required: true },
          { name: "rentAmount", label: "Rent amount (if rented)", type: "number", placeholder: "e.g., 35000" },
          { name: "yearsInBusiness", label: "Years of Doing Business", type: "number", placeholder: "e.g., 8", required: true },
          { name: "natureOfBusiness", label: "Nature of business", type: "text", placeholder: "e.g., Two-Wheeler Dealership / Cement & Steel Dealership", required: true },
          { name: "stockValue", label: "Stock value (₹)", type: "number", placeholder: "e.g., 2500000", required: true },
          { name: "visibleStaff", label: "Visible staff", type: "number", placeholder: "e.g., 6", required: true },
          { name: "availableStaff", label: "Available staff", type: "number", placeholder: "e.g., 10", required: true },
          { name: "incomeOrItr", label: "Month income or yearly itr", type: "text", placeholder: "e.g., ₹2,50,000/mo or ₹30L ITR", required: true },
          { name: "constitution", label: "Proprietaryship of partnerships", type: "select", options: CONSTITUTION_TYPES, required: true },
        ],
      },
      {
        title: "3. Dealer Verification & Banking Details",
        fields: [
          { name: "stockSighted", label: "Stock Sighted Yes / No", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "setupSighted", label: "Business Setup Sighted Yes / No", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "activitiesSighted", label: "Business activities Sighted Yes / No", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "nameBoard", label: "Name Board Yes / No", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "businessProof", label: "Business Proof", type: "text", placeholder: "e.g., Dealership Agreement, GST, Trade License", required: true },
          { name: "dealerEmail", label: "MAIL ID", type: "text", placeholder: "dealer@business.com", required: true },
          { name: "idCardSighted", label: "ID CARD YES / NO", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "bankAndAccountDetails", label: "BANK AND ACCOUNT DETAILS", type: "textarea", placeholder: "Bank Name: State Bank of India\nA/C No: 39485720194\nIFSC: SBIN0004521\nBranch: Main Branch", required: true },
          { name: "neighbourNameAge", label: "Neighbour Name and Age", type: "text", placeholder: "e.g., Balan, 48 yrs", required: true },
          { name: "landmark", label: "Landmark", type: "text", placeholder: "e.g., Near Toll Plaza", required: true },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     7. RESIDENTIAL PROFILE FOR DSA
  ───────────────────────────────────────────────────────────── */
  {
    id: "dsa_residential",
    code: "DSA_RESIDENTIAL",
    name: "Residential Profile for DSA",
    category: "DSA",
    description: "Direct Selling Agent home residence, bank connections, and loan distribution background.",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
    sections: [
      {
        title: "1. Residential Background",
        fields: [
          { name: "applicantName", label: "Applicant Name", type: "text", placeholder: "DSA applicant name", required: true },
          { name: "addressTraceable", label: "Address Traceable or Not", type: "select", options: TRACEABLE_OPTIONS, required: true },
          { name: "addressConfirmed", label: "Address Confirmed or Not", type: "select", options: CONFIRMED_OPTIONS, required: true },
          { name: "doorNoMatched", label: "Door No Matched or Not", type: "select", options: MATCHED_OPTIONS, required: true },
          { name: "metPersonName", label: "Met Person Name", type: "text", placeholder: "Person met", required: true },
          { name: "metPersonRelation", label: "Met Person Relation with Applicant", type: "text", placeholder: "e.g., Self, Wife", required: true },
          { name: "constructionType", label: "Rc/hut/chawl/ac", type: "select", options: CONSTRUCTION_TYPES, required: true },
          { name: "sqft", label: "Sqft", type: "number", placeholder: "e.g., 1000" },
          { name: "ownershipName", label: "Own who's Name", type: "text", placeholder: "Property owner name" },
          { name: "buildingTypeColour", label: "Building Type and Colour", type: "text", placeholder: "e.g., 1st Floor Flat, Green Colour" },
          { name: "rentedOrOwn", label: "Rented / Own", type: "select", options: OWNED_RENTED_OPTIONS, required: true },
          { name: "rentAmount", label: "Rent Amount (if rented)", type: "number", placeholder: "e.g., 12000" },
          { name: "yearsStayed", label: "Yrs of Stayed in this Home", type: "number", placeholder: "e.g., 4", required: true },
          { name: "familyMembers", label: "Family members", type: "number", placeholder: "e.g., 4", required: true },
          { name: "earningMembers", label: "Earning Members", type: "number", placeholder: "e.g., 2", required: true },
          { name: "applicantWork", label: "Applicant (work / no of yrs / salary / Designation)", type: "text", placeholder: "e.g., DSA Loan Agent / 5 yrs / ₹75,000 / Senior Associate", required: true },
          { name: "applicantWife", label: "Applicant Wife", type: "text", placeholder: "Housewife / Working" },
          { name: "son", label: "Son", type: "text", placeholder: "Details" },
          { name: "daughter", label: "Daughter", type: "text", placeholder: "Details" },
          { name: "proofSighted", label: "Proof Sighted Yes/No", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "politicalLink", label: "Any Political Link", type: "select", options: YES_NO_OPTIONS, required: true },
        ],
      },
      {
        title: "2. DSA Operations & Bank Portfolios",
        fields: [
          { name: "typeOfLoansDoing", label: "Type of Loans Doing (hl / bl / pl)", type: "select", options: LOAN_TYPES_DSA, required: true },
          { name: "nameOfBanks", label: "Name of Banks (Tie-ups)", type: "text", placeholder: "e.g., HDFC, ICICI, Axis Bank, Bajaj Finance", required: true },
          { name: "monthIncomeOrItr", label: "Month Income or Yearly itr", type: "text", placeholder: "e.g., ₹80,000 / ₹10,50,000 ITR", required: true },
          { name: "neighbourNameAge", label: "Neighbour Name and Age", type: "text", placeholder: "e.g., Vasanth, 39 yrs", required: true },
          { name: "landmark", label: "Landmark", type: "text", placeholder: "e.g., Behind Petrol Bunk", required: true },
          { name: "note", label: "Note", type: "textarea", placeholder: "General remarks about DSA credentials..." },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     8. BUSINESS PROFILE FOR DSA
  ───────────────────────────────────────────────────────────── */
  {
    id: "dsa_business",
    code: "DSA_BUSINESS",
    name: "Business Profile for DSA",
    category: "DSA",
    description: "DSA branch office verification, computers/printers setup, staff, and DSA bank tie-ups.",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
    sections: [
      {
        title: "1. DSA Office Location",
        fields: [
          { name: "applicantName", label: "Applicant Name", type: "text", placeholder: "DSA name", required: true },
          { name: "addressTraceable", label: "Address Traceble or Not", type: "select", options: TRACEABLE_OPTIONS, required: true },
          { name: "addressConfirmed", label: "Address Confirmed or Not", type: "select", options: CONFIRMED_OPTIONS, required: true },
          { name: "doorNoMatched", label: "Door No Matched or Not", type: "select", options: MATCHED_OPTIONS, required: true },
          { name: "areaType", label: "Area - Commercial/Residence / Slum", type: "select", options: AREA_TYPE_OPTIONS, required: true },
          { name: "metPersonName", label: "Met Person Name", type: "text", placeholder: "Person met", required: true },
          { name: "metPersonDesignation", label: "Met Person Designation", type: "text", placeholder: "e.g., DSA Director / Office Manager", required: true },
        ],
      },
      {
        title: "2. Office Infrastructure & IT Setup",
        fields: [
          { name: "constructionType", label: "Rc/hut/chawl/ac", type: "select", options: CONSTRUCTION_TYPES, required: true },
          { name: "sqft", label: "Sqft", type: "number", placeholder: "e.g., 800", required: true },
          { name: "rentedOrOwn", label: "Rented / Own", type: "select", options: OWNED_RENTED_OPTIONS, required: true },
          { name: "rentAmount", label: "Rent Amount (if rented)", type: "number", placeholder: "e.g., 18000" },
          { name: "ownershipName", label: "Own who's Name", type: "text", placeholder: "Owner name" },
          { name: "natureOfBusiness", label: "Nature of Business", type: "text", defaultValue: "DSA Loan Sourcing & Financial Consultancy", required: true },
          { name: "proprietorPartnerName", label: "Proprietor/Partner/Director Name", type: "text", placeholder: "Managing Partner", required: true },
          { name: "constitution", label: "Proprietaryship or Partnership", type: "select", options: CONSTITUTION_TYPES, required: true },
          { name: "yearsInBusiness", label: "Yrs of Doing Business", type: "number", placeholder: "e.g., 6", required: true },
          { name: "computerNos", label: "Computer Nos (Desktops / Laptops Count)", type: "number", placeholder: "e.g., 5", required: true },
          { name: "printerAvailable", label: "Printer (Available Yes/No)", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "netConAvailability", label: "Net Con Availability (Broadband / Wi-Fi)", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "visibleStaff", label: "Visible Staff", type: "number", placeholder: "e.g., 4", required: true },
          { name: "availableStaff", label: "Available Staff", type: "number", placeholder: "e.g., 6", required: true },
        ],
      },
      {
        title: "3. DSA Loan Operations & Sighting",
        fields: [
          { name: "businessSetupSighted", label: "Business Setup Sighted or Not", type: "select", options: SIGHTED_OPTIONS, required: true },
          { name: "businessActivitySighted", label: "Business Activity Sighted or Not", type: "select", options: SIGHTED_OPTIONS, required: true },
          { name: "nameBoard", label: "Name Board Yes or No", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "businessProof", label: "Business Proof", type: "text", placeholder: "e.g., DSA Code Letters, Bank Empanelment Certificates", required: true },
          { name: "monthIncomeOrItr", label: "Month Income or Yearly itr", type: "text", placeholder: "e.g., ₹1,20,000/mo", required: true },
          { name: "typeOfLoansDoing", label: "Type of Loans Doing (hl / bl / pl)", type: "select", options: LOAN_TYPES_DSA, required: true },
          { name: "nameOfBanks", label: "Name of Banks", type: "text", placeholder: "e.g., SBI, HDFC, Kotak Mahindra, L&T Finance", required: true },
          { name: "neighbourNameAge", label: "Neighbour Name and Age", type: "text", placeholder: "e.g., Karthik, 44 yrs", required: true },
          { name: "landmark", label: "Landmark", type: "text", placeholder: "e.g., 2nd Floor Above Apollo Pharmacy", required: true },
          { name: "note", label: "Note", type: "textarea", placeholder: "DSA office quality and staff interaction notes..." },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     9. RESI CUM BUSINESS PROFILE FOR DSA
  ───────────────────────────────────────────────────────────── */
  {
    id: "dsa_resi_cum_business",
    code: "DSA_RESI_CUM_BUSINESS",
    name: "Resi Cum Business Profile for DSA",
    category: "DSA",
    description: "Combined residence and DSA operations verification in home-office setups.",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
    sections: [
      {
        title: "1. Location & Residence Details",
        fields: [
          { name: "applicantName", label: "Applicant", type: "text", placeholder: "DSA name", required: true },
          { name: "addressTraceable", label: "Address Traceable or Not", type: "select", options: TRACEABLE_OPTIONS, required: true },
          { name: "addressConfirmed", label: "Address Confirmed or Not", type: "select", options: CONFIRMED_OPTIONS, required: true },
          { name: "doorNoMatched", label: "Door No Matched or Not", type: "select", options: MATCHED_OPTIONS, required: true },
          { name: "areaType", label: "Area - Commercial / Residence / Slum", type: "select", options: AREA_TYPE_OPTIONS, required: true },
          { name: "metPerson", label: "Met Person", type: "text", placeholder: "Person met", required: true },
          { name: "metPersonRelationship", label: "Met Person Relationship with Applicant", type: "text", placeholder: "e.g., Self, Spouse", required: true },
          { name: "constructionType", label: "Rc/hut/chawl/ac", type: "select", options: CONSTRUCTION_TYPES, required: true },
          { name: "sqft", label: "Sqft", type: "number", placeholder: "e.g., 1100" },
          { name: "ownershipName", label: "Own who's Name", type: "text", placeholder: "Owner name" },
          { name: "rentedOrOwn", label: "Rented / Own", type: "select", options: OWNED_RENTED_OPTIONS, required: true },
          { name: "rentAmount", label: "Rent Amount (if rented)", type: "number", placeholder: "e.g., 14000" },
          { name: "yearsStayed", label: "Yrs of Stayed in this Home", type: "number", placeholder: "e.g., 5", required: true },
          { name: "familyMembers", label: "Family members", type: "number", placeholder: "e.g., 4", required: true },
          { name: "earningMembers", label: "Earning Members", type: "number", placeholder: "e.g., 2", required: true },
          { name: "buildingTypeColour", label: "Building Type and Colour", type: "text", placeholder: "e.g., Duplex Cream Colour" },
          { name: "applicantWork", label: "Applicant (work / no of yrs / salary / Designation)", type: "text", placeholder: "e.g., DSA Consultant / 5 yrs / ₹80k / Founder", required: true },
          { name: "applicantWife", label: "Applicant Wife (work / no of yrs / salary / Designation)", type: "text", placeholder: "e.g., HW / Co-Partner" },
          { name: "son", label: "Son", type: "text", placeholder: "Details" },
          { name: "daughter", label: "Daughter", type: "text", placeholder: "Details" },
          { name: "politicalLink", label: "Any Political link", type: "select", options: YES_NO_OPTIONS, required: true },
        ],
      },
      {
        title: "2. DSA Home Office Operations",
        fields: [
          { name: "natureOfBusiness", label: "Nature of Business", type: "text", defaultValue: "DSA Loan Consultancy & Documentation", required: true },
          { name: "yearsInBusiness", label: "Yrs of Doing Business", type: "number", placeholder: "e.g., 4", required: true },
          { name: "proprietorPartnerName", label: "Proprietor/Partner/Director Name", type: "text", placeholder: "Owner name", required: true },
          { name: "constitution", label: "Proprietaryship or Partnership", type: "select", options: CONSTITUTION_TYPES, required: true },
          { name: "computerNos", label: "Computer Nos", type: "number", placeholder: "e.g., 3", required: true },
          { name: "printer", label: "Printer (Available Yes/No)", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "netConAvailability", label: "Net Con Availability", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "visibleStaff", label: "Visible Staff", type: "number", placeholder: "e.g., 2" },
          { name: "availableStaff", label: "Available Staff", type: "number", placeholder: "e.g., 3" },
          { name: "monthIncomeOrItr", label: "Month Income or Yearly itr", type: "text", placeholder: "e.g., ₹75,000 / mo", required: true },
          { name: "typeOfLoansDoing", label: "Type of Loans Doing (hl / bl / pl)", type: "select", options: LOAN_TYPES_DSA, required: true },
          { name: "nameOfBanks", label: "Name of Banks", type: "text", placeholder: "e.g., HDFC, SBI, PNB Housing", required: true },
          { name: "neighbourNameAge", label: "Neighbour Name and Age", type: "text", placeholder: "e.g., Rajan, 51 yrs", required: true },
          { name: "landmark", label: "Landmark", type: "text", placeholder: "e.g., Near Post Office", required: true },
          { name: "note", label: "Note", type: "textarea", defaultValue: "Both Office and Home are the Same Address" },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     10. CD LOAN ASSET VERIFICATION PROFILE
  ───────────────────────────────────────────────────────────── */
  {
    id: "cd_loan_asset",
    code: "CD_LOAN_ASSET",
    name: "CD Loan Asset Verification Profile",
    category: "Asset",
    description: "Consumer durable product inspection, usage check, loan downpayment, and EMI validation.",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    sections: [
      {
        title: "1. Residential Profile & Living Status",
        fields: [
          { name: "applicantName", label: "Applicant", type: "text", placeholder: "Applicant name", required: true },
          { name: "addressTraceable", label: "Address Traceable or Not", type: "select", options: TRACEABLE_OPTIONS, required: true },
          { name: "addressConfirmed", label: "Address Confirmed or Not", type: "select", options: CONFIRMED_OPTIONS, required: true },
          { name: "doorNoMatched", label: "Door No Matched or Not", type: "select", options: MATCHED_OPTIONS, required: true },
          { name: "metPerson", label: "Met Person", type: "text", placeholder: "Person met", required: true },
          { name: "metPersonRelationship", label: "Met Person Relationship with Applicant", type: "text", placeholder: "e.g., Self, Spouse, Mother", required: true },
          { name: "constructionType", label: "Rc/hut/chel/ac", type: "select", options: CONSTRUCTION_TYPES, required: true },
          { name: "sqft", label: "Sqft", type: "number", placeholder: "e.g., 650" },
          { name: "buildingTypeColour", label: "Building Type and Colour", type: "text", placeholder: "e.g., Single Storey Grey Colour" },
          { name: "rentedOrOwn", label: "Rented / Own", type: "select", options: OWNED_RENTED_OPTIONS, required: true },
          { name: "rentAmount", label: "Rent Amount (if rented)", type: "number", placeholder: "e.g., 7000" },
          { name: "yearsStayed", label: "Years of Stayed in this Home", type: "number", placeholder: "e.g., 7", required: true },
          { name: "familyMembers", label: "Family Members", type: "number", placeholder: "e.g., 4", required: true },
          { name: "earningMembers", label: "Earning Members", type: "number", placeholder: "e.g., 1", required: true },
          { name: "applicantWork", label: "Applicant (work / no years / salary / Designation)", type: "text", placeholder: "e.g., Sales Executive / 3 yrs / ₹28,000", required: true },
          { name: "wifeWork", label: "Wife (hw or work / no yrs / salary / Designation)", type: "text", placeholder: "e.g., Housewife" },
          { name: "politicalLink", label: "Any Political Link Yes/No", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "proofSighted", label: "Proof Sighted", type: "text", placeholder: "Aadhaar Card, EB Bill", required: true },
        ],
      },
      {
        title: "2. Consumer Durable Asset Inspection",
        fields: [
          { name: "assetUsage", label: "Applicant using or Gifted", type: "select", options: ASSET_USAGE_OPTIONS, required: true },
          { name: "assetSeen", label: "Asset Seen (Product make & model sighted)", type: "text", placeholder: "e.g., Samsung 55 Inch 4K Smart TV / LG Double Door Fridge", required: true },
          { name: "loanAmount", label: "Loan amount (₹)", type: "number", placeholder: "e.g., 45000", required: true },
          { name: "initialAmount", label: "Initial Downpayment Amount Paid (₹)", type: "number", placeholder: "e.g., 5000", required: true },
          { name: "emi", label: "Monthly EMI (₹)", type: "number", placeholder: "e.g., 3800", required: true },
          { name: "neighbourNameAge", label: "Neighbour Name and Age", type: "text", placeholder: "e.g., Mohan, 46 yrs", required: true },
          { name: "landmark", label: "Landmark", type: "text", placeholder: "e.g., Near Corporation School", required: true },
          { name: "note", label: "Note", type: "textarea", placeholder: "Serial number, asset condition, and invoice sighting notes..." },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     11. PROPERTY PROFILE
  ───────────────────────────────────────────────────────────── */
  {
    id: "property",
    code: "PROPERTY",
    name: "Property Profile",
    category: "Property",
    description: "Site survey, construction status, 4-boundary identification, and per-sqft valuation.",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    sections: [
      {
        title: "1. Property & Meeting Details",
        fields: [
          { name: "applicantName", label: "Applicant Name", type: "text", placeholder: "Buyer / Applicant name", required: true },
          { name: "addressTraceable", label: "Address Traceable or Not", type: "select", options: TRACEABLE_OPTIONS, required: true },
          { name: "addressConfirmed", label: "Address confirmed or Not", type: "select", options: CONFIRMED_OPTIONS, required: true },
          { name: "doorNoMatched", label: "Door No Matched or Not", type: "select", options: MATCHED_OPTIONS, required: true },
          { name: "metPersonName", label: "Met person Name", type: "text", placeholder: "Person met at site", required: true },
          { name: "metPersonRelation", label: "Met Person Relation with Applicant", type: "text", placeholder: "e.g., Self, Site Engineer, Watchman", required: true },
        ],
      },
      {
        title: "2. Construction Stage & Property Spec",
        fields: [
          { name: "underConstruction", label: "Under construction or Not", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "materialSighted", label: "Material sight or Not (Sand, Bricks, Steel)", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "staffWorking", label: "Staff working or Not (Labour on site)", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "typeOfProperty", label: "Type of Property", type: "select", options: PROPERTY_TYPES, required: true },
          { name: "propertyTotalSqft", label: "Property Total Sqft", type: "number", placeholder: "e.g., 2400", required: true },
          { name: "perCentValue", label: "Per. Cent Value / Per Sqft Value (₹)", type: "text", placeholder: "e.g., ₹2,800/sqft or ₹4.5 Lakhs/Cent", required: true },
          { name: "slumArea", label: "Slum area or Not", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "politicalLinkOrDispute", label: "Any Political Link or Problem in The Property", type: "select", options: YES_NO_OPTIONS, required: true },
          { name: "ownerOfTheProperty", label: "Owner of the Property (As per documents)", type: "text", placeholder: "Name of registered owner", required: true },
        ],
      },
      {
        title: "3. Four Boundaries & Accessibility",
        fields: [
          { name: "leftSide", label: "Left Side (Adjacent Property / Vacant / Road)", type: "text", placeholder: "e.g., Plot No 42 - Mr. Shankar's House", required: true },
          { name: "rightSide", label: "Right Side (Adjacent Property / Vacant / Road)", type: "text", placeholder: "e.g., Vacant Land Plot No 44", required: true },
          { name: "frontSide", label: "Front Side (30ft Tar Road / North Facing)", type: "text", placeholder: "e.g., 30ft Municipal Tar Road (East Facing)", required: true },
          { name: "backSide", label: "Back side (Boundary details)", type: "text", placeholder: "e.g., Compound Wall / Drainage Canal", required: true },
          { name: "kmFromBranch", label: "Km (Distance from Branch / Main Highway)", type: "text", placeholder: "e.g., 4.5 Km from Bypass", required: true },
          { name: "neighbourNameAge", label: "Neighbour Name and Age", type: "text", placeholder: "e.g., Devaraj, 52 yrs", required: true },
          { name: "landmark", label: "Landmark", type: "text", placeholder: "e.g., Near Greenfields Layout Main Arch", required: true },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     12. SELLER PROFILE
  ───────────────────────────────────────────────────────────── */
  {
    id: "seller",
    code: "SELLER",
    name: "Seller Profile",
    category: "Property",
    description: "Property seller identity, token money, agreed valuation, and buyer-seller connection.",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
    sections: [
      {
        title: "1. Seller Identification & Meeting",
        fields: [
          { name: "applicantName", label: "Applicant Name (Buyer)", type: "text", placeholder: "Buyer name", required: true },
          { name: "metPerson", label: "Met Person (Seller Name)", type: "text", placeholder: "Full seller name", required: true },
          { name: "metPersonRelationship", label: "Met Person Relationship with Applicant", type: "text", placeholder: "e.g., Seller / Broker / Relative", required: true },
        ],
      },
      {
        title: "2. Deal Financials & Background",
        fields: [
          { name: "totalPropertyAmount", label: "Total property Amount (₹)", type: "number", placeholder: "e.g., 4500000", required: true },
          { name: "initialAmount", label: "Initial / Token Advance Amount Paid (₹)", type: "number", placeholder: "e.g., 500000", required: true },
          { name: "relationshipBetweenBuyerSeller", label: "What is the relationship between buyer and seller", type: "text", placeholder: "e.g., Third-Party Direct Purchase / Acquaintance / Distant Relative", required: true },
          { name: "howSellerKnowsBuyer", label: "How does the seller know the buyer", type: "textarea", placeholder: "Duration of acquaintance, how deal was brokered...", required: true },
          { name: "kmFromBranch", label: "Km (Distance from Branch)", type: "text", placeholder: "e.g., 6.2 Km", required: true },
          { name: "note", label: "Note", type: "textarea", placeholder: "Any specific observations regarding property title or sale agreement..." },
        ],
      },
    ],
  },
];

export function getProfileByCode(code: string): VerificationProfileConfig {
  const normalized = (code || "").toUpperCase().trim();
  return (
    VERIFICATION_PROFILES.find((p) => p.code === normalized || p.id === code.toLowerCase()) ||
    VERIFICATION_PROFILES[0]
  );
}
