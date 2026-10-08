import { generateResiCumBusinessPdfReport, ReportCaseData } from './resiCumBusinessPdfGenerator';
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

  // Fallback to standard/residential RCU generator for now
  return await generateRcuPdfReport(caseData);
}

export { generateResiCumBusinessPdfReport };
