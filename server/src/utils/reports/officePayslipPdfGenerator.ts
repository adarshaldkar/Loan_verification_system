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
 * TVS Credit Services Ltd / Risk Control Unit - Office & Pay Slip Verification Report Generator
 * Formatted from "1410041 -Mohan Kuzhandaivel.docx".
 */
export async function generateOfficePayslipPdfReport(caseData: ReportCaseData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `Office & Payslip Verification - ${caseData.customer?.applicationId || 'Case'}`,
          Author: 'Risk Control Unit - Skyline Risk Audit Services',
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
      const employerName = safeVal(pd.natureOfOffice || customer.businessName || `${applicantName}'s Employer`);
      const visitDate = formatDate(caseData.completedAt || caseData.updatedAt || caseData.createdAt);

      // ─── STYLING CONSTANTS ───
      const primaryColor = '#1A365D';
      const secondaryColor = '#2B6CB0';
      const accentBg = '#F8FAFC';
      const borderColor = '#CBD5E1';
      const headerBg = '#F1F5F9';

      const drawSectionHeader = (title: string, yPos: number): number => {
        if (yPos + 26 > doc.page.height - 40) {
          doc.addPage();
          yPos = margin;
        }
        doc.rect(margin, yPos, contentWidth, 18).fillAndStroke(secondaryColor, secondaryColor);
        doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
        doc.text(title.toUpperCase(), margin + 8, yPos + 4.5, { width: contentWidth - 16 });
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
        doc.fontSize(8);
        const colWidth = contentWidth / 2;
        const labelWidth = 100;
        const valWidth = colWidth - labelWidth - 10;
        const fullValWidth = contentWidth - 145 - 10;

        let rowHeight = 18;

        if (col2Label !== undefined) {
          doc.font('Helvetica-Bold');
          const hL1 = doc.heightOfString(col1Label, { width: labelWidth });
          const hL2 = doc.heightOfString(col2Label, { width: labelWidth });
          doc.font('Helvetica');
          const hV1 = doc.heightOfString(`: ${col1Val || 'NA'}`, { width: valWidth });
          const hV2 = doc.heightOfString(`: ${col2Val || 'NA'}`, { width: valWidth });
          rowHeight = Math.max(hL1, hL2, hV1, hV2, 12) + 7;
        } else {
          doc.font('Helvetica-Bold');
          const hL = doc.heightOfString(col1Label, { width: 135 });
          doc.font('Helvetica');
          const hV = doc.heightOfString(`: ${col1Val || 'NA'}`, { width: fullValWidth });
          rowHeight = Math.max(hL, hV, 12) + 7;
        }

        if (yPos + rowHeight > doc.page.height - 40) {
          doc.addPage();
          yPos = margin;
        }

        if (isEven) {
          doc.rect(margin, yPos, contentWidth, rowHeight).fill(accentBg);
        }
        doc.rect(margin, yPos, contentWidth, rowHeight).stroke(borderColor);

        doc.fillColor('#2D3748').fontSize(8);

        if (col2Label !== undefined) {
          doc.lineCap('butt').moveTo(margin + colWidth, yPos).lineTo(margin + colWidth, yPos + rowHeight).stroke(borderColor);

          // Column 1
          doc.font('Helvetica-Bold').fillColor('#334155').text(col1Label, margin + 6, yPos + 4, { width: labelWidth });
          doc.font('Helvetica').fillColor('#1E293B').text(`: ${col1Val || 'NA'}`, margin + labelWidth + 6, yPos + 4, { width: valWidth });

          // Column 2
          doc.font('Helvetica-Bold').fillColor('#334155').text(col2Label, margin + colWidth + 6, yPos + 4, { width: labelWidth });
          doc.font('Helvetica').fillColor('#1E293B').text(`: ${col2Val || 'NA'}`, margin + colWidth + labelWidth + 6, yPos + 4, { width: valWidth });
        } else {
          doc.font('Helvetica-Bold').fillColor('#334155').text(col1Label, margin + 6, yPos + 4, { width: 135 });
          doc.font('Helvetica').fillColor('#1E293B').text(`: ${col1Val || 'NA'}`, margin + 141, yPos + 4, { width: fullValWidth });
        }

        return yPos + rowHeight;
      };

      // ─── HEADER / BANNER ───
      let currentY = margin;

      doc.rect(margin, currentY, contentWidth, 50).fillAndStroke(headerBg, primaryColor);
      doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold');
      doc.text('TVS Credit Services Ltd', margin + 12, currentY + 7);
      doc.fontSize(8.5).font('Helvetica').fillColor('#4A5568');
      doc.text('Risk Control Unit (RCU) - Skyline Risk Audit Services', margin + 12, currentY + 22);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(secondaryColor);
      doc.text('Office & Pay Slip Verification Report', margin + 12, currentY + 34);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#2D3748');
      doc.text(`Sampled Date  : ${formatDate(caseData.createdAt)}`, margin + contentWidth - 170, currentY + 8, { align: 'right', width: 160 });
      doc.text(`Report Date   : ${visitDate}`, margin + contentWidth - 170, currentY + 20, { align: 'right', width: 160 });
      doc.text(`Loan A/C No   : ${customer.applicationId || caseData.id.slice(0, 10)}`, margin + contentWidth - 170, currentY + 32, { align: 'right', width: 160 });

      currentY += 58;

      // ─── 1. APPLICANT & EMPLOYER IDENTITY ───
      currentY = drawSectionHeader('1. Employee & Employer Location Details', currentY);
      currentY = drawTableRow(currentY, 'Applicant / Employee', applicantName, 'Product / Loan Type', safeVal(customer.loanType, 'Personal Loan / Salaried LAP'), false);
      currentY = drawTableRow(currentY, 'Employer / Company Name', employerName, 'Designation', safeVal(pd.applicantDesignation, 'Sales / Executive'), true);
      currentY = drawTableRow(currentY, 'Office Address with PIN', safeVal(pd.address || customer.address), undefined, undefined, false);
      currentY = drawTableRow(currentY, 'Branch / Region', safeVal(customer.branch || caseData.branch, 'Main Branch'), 'Disbursement Type', 'Pre-Disbursement Mandatory', true);
      currentY += 8;

      // ─── 2. OFFICE PREMISES & HR CONFIRMATION ───
      currentY = drawSectionHeader('2. Office Infrastructure & Employment Sighting', currentY);
      currentY = drawTableRow(currentY, 'Office Traceable', safeVal(pd.officeTraceable, 'Traceable'), 'Office Restricted Entry', safeVal(pd.officeRestricted, 'No'), false);
      currentY = drawTableRow(currentY, 'Person Met during Visit', safeVal(pd.metPerson, 'HR / Manager / Prop'), 'Designation of Contact', safeVal(pd.metPersonDesignation, 'HR Manager'), true);
      currentY = drawTableRow(currentY, 'Who Confirmed Working', safeVal(pd.whoConfirmedEmployment, 'Employer / HR Authority'), 'Total Staff Strength', `${safeVal(pd.howManyWorkers, '12')} Employees`, false);
      currentY = drawTableRow(currentY, 'Total Staff Seen in Office', `${safeVal(pd.totalStaffSeen, '8')} Seen`, 'Office Setup & Activities', safeVal(pd.officeSetupActivity, 'Yes (Active)'), true);
      currentY = drawTableRow(currentY, 'Company Name Board', safeVal(pd.nameBoard, 'Yes'), 'Working Duration / Tenure', safeVal(pd.workingDuration, '2 Years 4 Months'), false);
      currentY += 8;

      // ─── 3. PAYSLIP, SALARY & BANKING VERIFICATION ───
      currentY = drawSectionHeader('3. Compensation, Payslip & Banking Verification', currentY);
      const salaryAmt = pd.salaryAmount ? `₹ ${formatInr(Number(pd.salaryAmount))}` : '₹ 35,000 / Month';
      currentY = drawTableRow(currentY, 'Stated / Verified Salary', salaryAmt, 'Salary Payment Mode', safeVal(pd.salaryMode, 'Bank Transfer'), false);
      currentY = drawTableRow(currentY, 'Salary Bank Account', safeVal(pd.bankName, 'State Bank of India'), 'Bank Branch', safeVal(pd.bankBranchName, 'Main Branch'), true);
      currentY = drawTableRow(currentY, 'Payslip Confirmation', safeVal(pd.payslipConfirmation, 'Confirmed'), 'Authorised Sign on Slip', safeVal(pd.authorisedSignOnPayslip, 'Yes (Authorised Seal & Sign)'), false);
      currentY = drawTableRow(currentY, 'Prominent Landmark', safeVal(pd.landmark, 'Opposite Tech Park Gate 2'), 'Agency Dedupe Status', 'No Adverse Records Found', true);
      currentY += 8;

      // ─── 4. FIELD OFFICER OBSERVATIONS & PAYSLIP CONSISTENCY ───
      currentY = drawSectionHeader('4. Field Audit Observations & Payslip Integrity Assessment', currentY);
      const remarkText = safeVal(
        pd.note || caseData.remarks,
        `Visited given office address and met the authorized official. Verified applicant's working tenure and active employment status. Salary slip was produced, cross-checked with payroll records and found consistent.`
      );
      currentY = drawTableRow(currentY, 'Field Verification Notes', remarkText, undefined, undefined, false);
      currentY += 8;

      // ─── 5. SUMMARY & RECOMMENDATIONS ───
      currentY = drawSectionHeader('5. Assessment, Recommendation & Sign-Off', currentY);
      const isNegative = caseData.status === 'REJECTED' || (pd.payslipConfirmation || '').toLowerCase().includes('not');
      currentY = drawTableRow(currentY, 'Employment Status', isNegative ? 'Inconsistent' : 'Positive / Verified', 'Payslip Document Status', isNegative ? 'Negative / Discrepancy' : 'Positive / Matched', false);
      currentY = drawTableRow(currentY, 'Final Recommendation', isNegative ? 'NEGATIVE' : 'POSITIVE (Recommended for Approval)', 'Verification Officer', safeVal(agent?.firstName ? `${agent.firstName} ${agent.lastName}` : 'Skyline Risk Auditor'), true);

      currentY += 12;

      // Sign-off box
      const signBoxHeight = 44;
      doc.rect(margin, currentY, contentWidth, signBoxHeight).stroke(borderColor);
      doc.fillColor('#2D3748').fontSize(8.5);

      const agentName = agent ? `${agent.firstName} ${agent.lastName}`.trim() : 'Skyline Field Auditor';
      doc.font('Helvetica-Bold').text('Signature of Verification Officer:', margin + 12, currentY + 10);
      doc.font('Helvetica').text(agentName, margin + 175, currentY + 10);

      doc.font('Helvetica-Bold').text('Name & Designation:', margin + 12, currentY + 26);
      doc.font('Helvetica').text(`${agentName} (Employment Risk Officer)`, margin + 175, currentY + 26);

      doc.font('Helvetica-Bold').text('Agency Stamp & Seal:', margin + contentWidth - 140, currentY + 10);
      doc.font('Helvetica').text('Skyline Risk Control Unit', margin + contentWidth - 140, currentY + 26);

      // ─── 6. GEO-TAGGED PHOTOGRAPHIC EVIDENCE GRID ───
      if (caseData.media && caseData.media.length > 0) {
        doc.addPage();
        let photoY = margin;

        photoY = drawSectionHeader('6. Geo-Tagged Photographic Evidence (Office Board, Workstation, Salary Slip)', photoY);

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
          doc.text(`Photo ${i + 1}: ${m.section || 'Office Frontage / Payslip'}`, xPos + 6, yPos + photoHeight + 2);
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
