import { generateResiCumBusinessPdfReport, ReportCaseData } from './resiCumBusinessPdfGenerator';
import { generateDealerPdfReport } from './dealerPdfGenerator';
import { generateDsaPdfReport } from './dsaPdfGenerator';
import { generatePropertyPdfReport } from './propertyPdfGenerator';
import { generateOfficePayslipPdfReport } from './officePayslipPdfGenerator';
import { generateRcuPdfReport } from '../rcuPdfReportGenerator';

/**
 * Master PDF Dispatcher:
 * Dynamically selects and executes the exact PDF report template matching
 * the specific verification profile type of the case.
 */
export async function generateDynamicCasePdf(caseData: ReportCaseData): Promise<Buffer> {
  const caseType = (caseData.type || '').toUpperCase().trim();

  let profileCode = caseType;
  if (caseData.profileData) {
    try {
      const parsed = typeof caseData.profileData === 'string'
        ? JSON.parse(caseData.profileData)
        : caseData.profileData;
      if (parsed.profileType) {
        profileCode = parsed.profileType.toUpperCase().trim();
      }
    } catch {
      // fallback to caseType
    }
  }

  // 1. Residential Cum Business Profile (Matches Agent profile report 1.doc)
  if (profileCode === 'RESI_CUM_BUSINESS' || profileCode === 'DSA_RESI_CUM_BUSINESS' || caseType === 'RESI_CUM_BUSINESS') {
    return await generateResiCumBusinessPdfReport(caseData);
  }

  // 2. Dealer Verification - Business Profile (Matches Dealer profile report - CD 1.doc & Dealer Profile Report - TW DSA.doc)
  if (profileCode === 'DEALERS' || profileCode === 'DEALER' || profileCode === 'DEALER_CD' || profileCode === 'DEALER_TW' || caseType === 'DEALERS') {
    return await generateDealerPdfReport(caseData);
  }

  // 3. DSA Vendor & Asset Verification (Matches DSA Report format.doc & AP-10558407 - K GANAPATHI.docx)
  if (
    profileCode === 'DSA_BUSINESS' ||
    profileCode === 'DSA' ||
    profileCode === 'DSA_RESIDENTIAL' ||
    profileCode === 'ASSET_VERIFICATION' ||
    profileCode === 'ASSET' ||
    profileCode === 'LOAN_ASSET' ||
    profileCode === 'CD_LOAN_ASSET' ||
    profileCode === 'CONNECTOR' ||
    caseType === 'DSA_BUSINESS' ||
    caseType === 'ASSET_VERIFICATION' ||
    caseType === 'CD_LOAN_ASSET'
  ) {
    return await generateDsaPdfReport(caseData);
  }

  // 4. Property Profile & Seller Verification (Matches SIVA SAKTHI SHELTERS.pdf & Report - PRABHAKHAR D.docx)
  if (
    profileCode === 'PROPERTY' ||
    profileCode === 'SELLER' ||
    profileCode === 'PROPERTY_VALUATION' ||
    profileCode === 'SITE_SURVEY' ||
    caseType === 'PROPERTY' ||
    caseType === 'SELLER'
  ) {
    return await generatePropertyPdfReport(caseData);
  }

  // 5. Office & Pay Slip Verification (Matches 1410041 -Mohan Kuzhandaivel.docx)
  if (
    profileCode === 'OFFICE_PAYSLIP' ||
    profileCode === 'OFFICE' ||
    profileCode === 'PAYSLIP' ||
    profileCode === 'SALARIED' ||
    caseType === 'OFFICE_PAYSLIP'
  ) {
    return await generateOfficePayslipPdfReport(caseData);
  }

  // Fallback to standard/residential RCU generator for now
  return await generateRcuPdfReport(caseData);
}

export {
  generateResiCumBusinessPdfReport,
  generateDealerPdfReport,
  generateDsaPdfReport,
  generatePropertyPdfReport,
  generateOfficePayslipPdfReport,
};




