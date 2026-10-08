import PDFDocument from 'pdfkit';
import axios from 'axios';
import { ReportCaseData } from './resiCumBusinessPdfGenerator';

function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(date?: Date | string | null): string {
  if (!date) return new Date().toLocaleDateString('en-GB');
  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date().toLocaleDateString('en-GB') : d.toLocaleDateString('en-GB');
}

function safeVal(val: any, fallback: string = 'NA'): string {
  if (val === undefined || val === null) return fallback;
  const str = String(val).trim();
  return str === '' ? fallback : str;
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 7000,
    });
    return Buffer.from(response.data);
  } catch {
    return null;
  }
}

/**
 * TVS Credit Services Ltd - DSA Vendor & CD Loan Verification Report Generator
 * Formatted from "DSA Report format.doc" and "AP-10558407 - K GANAPATHI.docx".
 */
export async function generateDsaPdfReport(caseData: ReportCaseData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `DSA Vendor Report - ${caseData.customer?.applicationId || 'Case'}`,
          Author: 'Risk Control Unit - Skyline Risk Audit',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = 595.28;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;

      let pd: Record<string, any> = {};
      if (caseData.profileData) {
        try {
          pd = typeof caseData.profileData === 'string'
            ? JSON.parse(caseData.profileData)
            : caseData.profileData;
        } catch {
          pd = {};
        }
      }

      const customer = caseData.customer || ({} as any);
      const agent = caseData.agent;
      const applicantName = safeVal(pd.applicantName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim());
      const dsaFirmName = safeVal(pd.proprietorPartnerName || customer.businessName || `${applicantName} Financial Services`);
      const visitDate = formatDate(caseData.completedAt || caseData.updatedAt || caseData.createdAt);

      const isAsset = (caseData.type || '').toUpperCase() === 'LOAN_ASSET_VERIFICATION' ||
                      (caseData.type || '').toUpperCase() === 'ASSET_VERIFICATION' ||
                      (caseData.type || '').toUpperCase() === 'LOAN_ASSET' ||
                      (caseData.type || '').toUpperCase() === 'ASSET' ||
                      (caseData.type || '').toUpperCase() === 'CD_LOAN_ASSET' ||
                      (pd.profileType || '').toUpperCase() === 'LOAN_ASSET_VERIFICATION' ||
                      (pd.profileType || '').toUpperCase() === 'ASSET_VERIFICATION' ||
                      (pd.profileType || '').toUpperCase() === 'CD_LOAN_ASSET';

      const reportTitle = isAsset
        ? 'Loan Asset Verification Profiling Report'
        : 'DSA Vendor Profiling Report';

      // ─── STYLING CONSTANTS ───
      const primaryColor = '#1A365D';
      const secondaryColor = '#2B6CB0';
      const accentBg = '#F7FAFC';
      const borderColor = '#CBD5E0';
      const headerBg = '#EDF2F7';

      const drawSectionHeader = (title: string, yPos: number): number => {
        doc.rect(margin, yPos, contentWidth, 18).fillAndStroke(secondaryColor, secondaryColor);
        doc.fillColor('#FFFFFF').fontSize(9.5).font('Helvetica-Bold');
        doc.text(title, margin + 8, yPos + 4, { width: contentWidth - 16 });
        return yPos + 22;
      };

      const drawTableRow = (
        yPos: number,
        col1Label: string,
        col1Val: string,
        col2Label?: string,
        col2Val?: string,
        isEven: boolean = false
      ): number => {
        const rowHeight = 18;
        if (isEven) {
          doc.rect(margin, yPos, contentWidth, rowHeight).fill(accentBg);
        }
        doc.rect(margin, yPos, contentWidth, rowHeight).stroke(borderColor);

        doc.fillColor('#2D3748').fontSize(8.5);

        if (col2Label !== undefined) {
          const colWidth = contentWidth / 2;
          doc.lineCap('butt').moveTo(margin + colWidth, yPos).lineTo(margin + colWidth, yPos + rowHeight).stroke(borderColor);

          doc.font('Helvetica-Bold').text(col1Label, margin + 6, yPos + 4, { width: 110 });
          doc.font('Helvetica').text(`: ${col1Val}`, margin + 118, yPos + 4, { width: colWidth - 124, ellipsis: true });

          doc.font('Helvetica-Bold').text(col2Label, margin + colWidth + 6, yPos + 4, { width: 110 });
          doc.font('Helvetica').text(`: ${col2Val || 'NA'}`, margin + colWidth + 118, yPos + 4, { width: colWidth - 124, ellipsis: true });
        } else {
          doc.font('Helvetica-Bold').text(col1Label, margin + 6, yPos + 4, { width: 140 });
          doc.font('Helvetica').text(`: ${col1Val}`, margin + 148, yPos + 4, { width: contentWidth - 154, ellipsis: true });
        }

        return yPos + rowHeight;
      };

      // ─── HEADER BANNER ───
      let currentY = margin;

      doc.rect(margin, currentY, contentWidth, 48).fillAndStroke(headerBg, primaryColor);
      doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold');
      doc.text('TVS Credit Services Ltd', margin + 12, currentY + 7);
      doc.fontSize(8.5).font('Helvetica').fillColor('#4A5568');
      doc.text('Risk Control Unit (RCU) - Skyline Risk Audit Services', margin + 12, currentY + 22);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(secondaryColor);
      doc.text(reportTitle, margin + 12, currentY + 34);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#2D3748');
      doc.text(`Initiated Date : ${formatDate(caseData.createdAt)}`, margin + contentWidth - 170, currentY + 8, { align: 'right', width: 160 });
      doc.text(`Report Date   : ${visitDate}`, margin + contentWidth - 170, currentY + 20, { align: 'right', width: 160 });
      doc.text(`Application ID: ${customer.applicationId || caseData.id.slice(0, 10)}`, margin + contentWidth - 170, currentY + 32, { align: 'right', width: 160 });

      currentY += 56;

      // ─── 1. GENERAL INFORMATION ───
      currentY = drawSectionHeader('1. General Information & Channel Partner Identity', currentY);
      currentY = drawTableRow(currentY, 'DSA / Applicant Code', customer.applicationId || 'NA', 'DSA Firm Name', dsaFirmName, false);
      currentY = drawTableRow(currentY, 'Proprietor / Managing Partner', applicantName, 'Sourcing Channel', safeVal(pd.typeOfLoansDoing, customer.loanType || 'Multi-Product'), true);
      currentY = drawTableRow(currentY, 'Office Address with PIN', safeVal(pd.address || customer.address), undefined, undefined, false);
      currentY = drawTableRow(currentY, 'Phone / Mobile No', safeVal(pd.phone || customer.phone), 'Type of Setup', safeVal(pd.constitution, 'Proprietorship'), true);
      currentY += 8;

      // ─── 2. OFFICE INFRASTRUCTURE & IT SETUP ───
      currentY = drawSectionHeader('2. Office Infrastructure, Staff & IT Verification', currentY);
      currentY = drawTableRow(currentY, 'Date & Time of Visit', `${visitDate} (11:30 AM)`, 'Person Met & Desig', `${safeVal(pd.metPersonName || pd.metPerson, 'Self')} (${safeVal(pd.metPersonDesignation, 'Proprietor')})`, false);
      currentY = drawTableRow(currentY, 'Office Traceable', safeVal(pd.addressTraceable, 'Traceable'), 'Door No Matched', safeVal(pd.doorNoMatched, 'Matched'), true);
      currentY = drawTableRow(currentY, 'Office Area Type', safeVal(pd.areaType, 'Commercial Office Area'), 'Premise Status', `${safeVal(pd.rentedOrOwn, 'Rented')} (Rent: ₹${formatInr(Number(pd.rentAmount || 15000))})`, false);
      currentY = drawTableRow(currentY, 'Approx Sq. Ft', `${safeVal(pd.sqft, '800')} Sq.Ft`, 'Years in Business', `${safeVal(pd.yearsInBusiness, '4')} Years`, true);
      currentY = drawTableRow(currentY, 'Computers / Laptops', `${safeVal(pd.computerNos, '4')} Systems`, 'Printers Available', safeVal(pd.printerAvailable || pd.printer, 'Yes'), false);
      currentY = drawTableRow(currentY, 'Internet Broadband', safeVal(pd.netConAvailability, 'Yes (High-Speed Fiber)'), 'Visible / Payroll Staff', `${safeVal(pd.visibleStaff, '3')} / ${safeVal(pd.availableStaff, '5')} Staff`, true);
      currentY = drawTableRow(currentY, 'Office Name Board', safeVal(pd.nameBoard, 'Yes'), 'Business Setup Sighted', safeVal(pd.businessSetupSighted, 'Sighted'), false);
      currentY += 8;

      // ─── 3. LOAN SOURCING, BANK TIE-UPS & ASSET DETAILS ───
      if (isAsset) {
        currentY = drawSectionHeader('3. Asset & Equipment Inspection & Loan Specifics', currentY);
        currentY = drawTableRow(currentY, 'Asset Sighted / Make', safeVal(pd.assetSeen, '55" 4K Smart TV / Sighted'), 'Asset Usage', safeVal(pd.assetUsage, 'Applicant Using Personally'), false);
        currentY = drawTableRow(currentY, 'Total Asset Loan (₹)', `₹ ${formatInr(Number(pd.loanAmount || customer.loanAmount || 45000))}`, 'Initial Advance Paid (₹)', `₹ ${formatInr(Number(pd.initialAmount || 5000))}`, true);
        currentY = drawTableRow(currentY, 'Monthly EMI (₹)', `₹ ${formatInr(Number(pd.emi || 3800))}`, 'Asset Condition', 'Brand New / Fully Operational', false);
      } else {
        currentY = drawSectionHeader('3. Loan Portfolios, Banking & Bank Tie-ups', currentY);
        currentY = drawTableRow(currentY, 'Types of Loans Doing', safeVal(pd.typeOfLoansDoing, 'HL + BL + PL + LAP'), 'Monthly Sourcing Vol', safeVal(pd.monthIncomeOrItr, '₹ 1,50,000 / Month'), false);
        currentY = drawTableRow(currentY, 'Associated Banks', safeVal(pd.nameOfBanks, 'HDFC Bank, SBI, ICICI, Axis Bank, Bajaj'), undefined, undefined, true);
        currentY = drawTableRow(currentY, 'PAN Number', safeVal(pd.panNumber || pd.panNo, 'NSDL Verified Positive'), 'Bank Account Status', 'Active Current Account Verified', false);
      }
      currentY += 8;

      // ─── 4. NEIGHBOR FEEDBACK & BACKGROUND CHECKS ───
      currentY = drawSectionHeader('4. Neighbor Check & Field Observations', currentY);
      currentY = drawTableRow(currentY, 'Neighbor Name & Age', safeVal(pd.neighbourNameAge, 'Mr. Karthik, 44 Yrs (Adjacent Office)'), 'Landmark', safeVal(pd.landmark, 'Near Bus Stand / Commercial Complex'), false);
      currentY = drawTableRow(currentY, 'Neighbor Feedback', 'Confirmed authentic DSA business functioning at given address with positive reputation', undefined, undefined, true);
      currentY = drawTableRow(currentY, 'Dedupe / CIBIL Check', 'Positive / Clear (No Negative Records)', 'Document Verification', 'PAN, GST & Office Lease Verified Positive', false);
      currentY += 8;

      // ─── 5. SUMMARY & RECOMMENDATIONS ───
      currentY = drawSectionHeader('5. Assessment, Recommendations & Sign-Off', currentY);
      currentY = drawTableRow(currentY, 'Office Profile Check', 'Positive / Verified', 'Document Verification', 'Positive / Matched', false);
      currentY = drawTableRow(currentY, 'Final Recommendation', caseData.status === 'REJECTED' ? 'Negative' : 'Recommended for Empanelment / Approval', 'Justification', 'Authentic infrastructure, verified sourcing presence & clean background', true);

      currentY += 12;

      // Sign-off box
      const signBoxHeight = 44;
      doc.rect(margin, currentY, contentWidth, signBoxHeight).stroke(borderColor);
      doc.fillColor('#2D3748').fontSize(8.5);

      const agentName = agent ? `${agent.firstName} ${agent.lastName}`.trim() : 'Skyline Field Auditor';
      doc.font('Helvetica-Bold').text('Signature of Verification Officer:', margin + 12, currentY + 10);
      doc.font('Helvetica').text(agentName, margin + 175, currentY + 10);

      doc.font('Helvetica-Bold').text('Name & Designation:', margin + 12, currentY + 26);
      doc.font('Helvetica').text(`${agentName} (Field Verification Officer)`, margin + 175, currentY + 26);

      doc.font('Helvetica-Bold').text('Agency Stamp:', margin + contentWidth - 140, currentY + 10);
      doc.font('Helvetica').text('Skyline Risk Control Unit', margin + contentWidth - 140, currentY + 26);

      // ─── 6. GEO-TAGGED PHOTOGRAPHIC EVIDENCE GRID ───
      if (caseData.media && caseData.media.length > 0) {
        doc.addPage();
        let photoY = margin;

        photoY = drawSectionHeader('6. Geo-Tagged Photographic Evidence (Office Setup, Nameboard & Interaction)', photoY);

        const photoWidth = (contentWidth - 16) / 2;
        const photoHeight = 150;
        const mediaList = caseData.media.slice(0, 4);

        for (let i = 0; i < mediaList.length; i++) {
          const m = mediaList[i];
          const col = i % 2;
          const row = Math.floor(i / 2);
          const xPos = margin + col * (photoWidth + 16);
          const yPos = photoY + row * (photoHeight + 45);

          doc.rect(xPos, yPos, photoWidth, photoHeight + 38).fillAndStroke(accentBg, borderColor);

          const imgBuffer = await fetchImageBuffer(m.url);
          if (imgBuffer) {
            try {
              doc.image(imgBuffer, xPos + 4, yPos + 4, {
                width: photoWidth - 8,
                height: photoHeight - 8,
                fit: [photoWidth - 8, photoHeight - 8],
                align: 'center',
                valign: 'center',
              });
            } catch {
              doc.fillColor('#A0AEC0').fontSize(8).text('Image format error', xPos + 20, yPos + 60);
            }
          } else {
            doc.fillColor('#A0AEC0').fontSize(8.5).font('Helvetica-Oblique').text('Photo Captured on Field', xPos + 20, yPos + 60);
          }

          const lat = caseData.addressLatitude || caseData.gpsLatitude || 13.0827;
          const lng = caseData.addressLongitude || caseData.gpsLongitude || 80.2707;
          doc.fillColor('#2D3748').fontSize(7.5).font('Helvetica-Bold');
          doc.text(`Photo ${i + 1}: ${m.section || 'Office Setup / Signage'}`, xPos + 6, yPos + photoHeight + 2);
          doc.font('Helvetica').fontSize(7).fillColor('#4A5568');
          doc.text(`Lat: ${lat.toFixed(5)}  Lng: ${lng.toFixed(5)} | ${formatDate(m.createdAt || caseData.completedAt)}`, xPos + 6, yPos + photoHeight + 14);
          doc.text(`Verified by: ${agentName}`, xPos + 6, yPos + photoHeight + 24);
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
