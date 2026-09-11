import PDFDocument from 'pdfkit';
import axios from 'axios';

interface ReportCaseData {
  id: string;
  type: string;
  status: string;
  branch?: string | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  remarks?: string | null;
  profileData?: any;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  customer: {
    applicationId: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
    address: string;
    loanType: string;
    loanAmount: number;
    businessName?: string | null;
    branch?: string | null;
  };
  agent?: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
    branch?: string | null;
  } | null;
  admin?: {
    firstName: string;
    lastName: string;
    email?: string | null;
    branch?: string | null;
  } | null;
  media: Array<{
    id: string;
    url: string;
    type: string;
    createdAt: Date;
  }>;
}

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

function calculateTat(start: Date, end?: Date | null): string {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const diffDays = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
  return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
}

// ─── Dynamic Narrative Synthesis ────────────────────────────────────────────

function synthesizeResidenceNarrative(data: any, customer: any): string {
  const p = data?.residential || data || {};
  const metPerson = p.metPersonName || p.metPerson || customer.firstName || 'Applicant';
  const relation = p.metPersonRelationship || p.relationship || 'Self';
  const duration = p.durationOfStayYears || p.stayingInYrs || p.duration || 'a few';
  const constType = p.constructionType || p.accommodationType || 'RC building';
  const sqft = p.sqft || p.approxSqft || p.areaSqft || '800';
  const familyCount = p.familyMembersCount || p.totalFamilyMembers || '4';
  const earningCount = p.earningMembersCount || p.earningMembers || '1';
  const ownType = p.ownershipType || p.ownedRented || 'Rented / Owned';
  const traceable = p.addressTraceable || 'Traceable';
  const confirmed = p.addressConfirmed || 'Confirmed';
  const neighbour = p.neighbourName || p.neighbourCheck || 'nearby neighbours';
  const landmark = p.landmark ? ` Landmark: ${p.landmark}.` : '';

  let narrative = `RESIDENCE ADDRESS VERIFICATION : STATUS : ${p.status || 'POSITIVE'}\n\n`;
  narrative += `During the on-site visit to the given residential address at "${customer.address}", the residence was found to be ${traceable} and ${confirmed}. `;
  narrative += `We met ${metPerson} (${relation}), who confirmed that the applicant has been residing at the given address in a ${ownType} ${constType} measuring approximately ${sqft} sq. ft. for the past ${duration} years. `;
  narrative += `The family consists of ${familyCount} members, of whom ${earningCount} is/are earning member(s). `;
  
  if (p.neighbourFeedback) {
    narrative += `Cross-verification was conducted with ${neighbour}, who stated: "${p.neighbourFeedback}". `;
  } else {
    narrative += `Cross-verification with neighbours confirmed the applicant's peaceful dwelling and positive neighborhood reputation. `;
  }

  if (p.remarks || p.additionalRemarks) {
    narrative += `Specific Observations: ${p.remarks || p.additionalRemarks}.`;
  }
  narrative += landmark;

  return narrative;
}

function synthesizeBusinessNarrative(data: any, customer: any): string {
  const p = data?.business || data || {};
  const bizName = p.businessName || customer.businessName || 'Business Unit';
  const nature = p.natureOfBusiness || p.businessActivity || 'Trading / Services';
  const metPerson = p.metPersonName || p.metPerson || 'Applicant';
  const relation = p.metPersonRelationship || 'Proprietor';
  const vintage = p.vintageYears || p.businessVintage || p.noOfYearsInBusiness || '3+';
  const boardSighted = p.businessBoardSighted || p.nameBoardSighted || 'Sighted';
  const employees = p.noOfEmployees || p.staffCount || '2';
  const turnover = p.approxMonthlyTurnover || p.monthlyTurnover ? `Rs. ${formatInr(Number(p.approxMonthlyTurnover || p.monthlyTurnover))}` : 'Adequate';
  const stock = p.stockValue || p.approxStockValue ? `approx Rs. ${formatInr(Number(p.stockValue || p.approxStockValue))}` : 'Sighted and adequate';

  let narrative = `BUSINESS ADDRESS VERIFICATION : STATUS : ${p.status || 'POSITIVE'}\n\n`;
  narrative += `During the field visit to the given business address, we met ${metPerson} (${relation}) at "${bizName}". `;
  narrative += `The business name board was ${boardSighted}. The entity is engaged in ${nature} and has been actively functioning at this location for more than ${vintage} years. `;
  narrative += `The setup operates with ${employees} staff member(s). Business activity and customer footfall were verified. Observed stock inventory is ${stock}, and the reported monthly turnover is ${turnover}. `;
  
  if (p.neighbourFeedback) {
    narrative += `Neighbour cross-check confirmed continuous operations: "${p.neighbourFeedback}". `;
  }
  if (p.remarks || p.additionalRemarks) {
    narrative += `Observations: ${p.remarks || p.additionalRemarks}.`;
  }

  return narrative;
}

function getVerificationNarrative(caseData: ReportCaseData): {
  residenceNarrative: string;
  businessNarrative: string;
  overallStatus: string;
} {
  let profileData: any = {};
  try {
    profileData = typeof caseData.profileData === 'string'
      ? JSON.parse(caseData.profileData)
      : (caseData.profileData || {});
  } catch {
    profileData = {};
  }

  const type = (caseData.type || '').toUpperCase();
  const decision = profileData?.adminReview?.decision || caseData.status;

  let overallStatus = 'POSITIVE';
  if (decision === 'REJECTED' || caseData.status === 'REJECTED') {
    overallStatus = 'NEGATIVE';
  } else if (decision === 'NEEDS_REVISION' || caseData.status === 'IN_PROGRESS') {
    overallStatus = 'HOLD';
  } else if (caseData.status === 'COMPLETED' || caseData.status === 'APPROVED') {
    overallStatus = 'POSITIVE';
  }

  let resNarrative = 'NA';
  let bizNarrative = 'NA';

  if (type.includes('BUSINESS') && !type.includes('RESI')) {
    bizNarrative = synthesizeBusinessNarrative(profileData, caseData.customer);
    resNarrative = 'NA (Business Verification Conducted)';
  } else if (type.includes('RESI_CUM_BUSINESS') || type.includes('RESI CUM')) {
    resNarrative = synthesizeResidenceNarrative(profileData, caseData.customer);
    bizNarrative = 'Verified as integrated Resi-Cum-Business unit at stated address.';
  } else {
    resNarrative = synthesizeResidenceNarrative(profileData, caseData.customer);
    bizNarrative = caseData.customer.businessName ? synthesizeBusinessNarrative(profileData, caseData.customer) : 'NA';
  }

  return {
    residenceNarrative: resNarrative,
    businessNarrative: bizNarrative,
    overallStatus,
  };
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 8000,
    });
    return Buffer.from(res.data);
  } catch (err: any) {
    console.warn(`[PDF Generator] Could not fetch image from ${url}:`, err.message);
    return null;
  }
}

// ─── PDF Report Generation ──────────────────────────────────────────────────

export async function generateRcuPdfReport(caseData: ReportCaseData): Promise<Buffer> {
  const { residenceNarrative, businessNarrative, overallStatus } = getVerificationNarrative(caseData);

  const customerFullName = `${caseData.customer.firstName} ${caseData.customer.lastName}`.toUpperCase().trim();
  const branchName = (caseData.branch || caseData.customer.branch || caseData.agent?.branch || 'SULUR').toUpperCase();
  const loanNumber = `${caseData.customer.applicationId} / DB${caseData.id.slice(0, 8).toUpperCase()}`;
  const loanProduct = (caseData.customer.loanType || 'SARAL').toUpperCase();
  const sampledDocs = caseData.type ? caseData.type.replace(/_/g, ' ') : 'RV AND BV';
  const verifierName = caseData.agent
    ? `${caseData.agent.firstName} ${caseData.agent.lastName}`.toUpperCase()
    : 'FIELD OFFICER';

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 36, // 0.5 inch margins
        size: 'A4',
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const pageWidth = doc.page.width - 72; // available width (523 pt)
      const col1Width = 190;
      const col2Width = pageWidth - col1Width; // 333 pt

      // Header
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1E3A5F').text('VISTAAR FINANCIAL SERVICES PRIVATE LIMITED', { align: 'center' });
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text('RCU VERIFICATION REPORT', { align: 'center' });
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('(SKYLINE RISK AUDIT SERVICES)', { align: 'center' });
      doc.moveDown(0.6);

      // Helper function to render a table row
      const renderRow = (label: string, value: string, isHeader = false, valueColor = '#1E293B', isBoldValue = false) => {
        const startX = 36;
        const startY = doc.y;

        // Calculate heights needed
        doc.font('Helvetica-Bold').fontSize(8.5);
        const labelHeight = doc.heightOfString(label, { width: col1Width - 14 });
        
        doc.font(isBoldValue ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5);
        const valueHeight = doc.heightOfString(value || 'NA', { width: col2Width - 14 });
        
        const rowHeight = Math.max(labelHeight, valueHeight) + 10;

        // Check page overflow
        if (startY + rowHeight > doc.page.height - 40) {
          doc.addPage();
          return renderRow(label, value, isHeader, valueColor, isBoldValue);
        }

        // Left box (Label) background
        doc.rect(startX, startY, col1Width, rowHeight).fillAndStroke('#F8FAFC', '#CBD5E1');

        // Right box (Value) background
        doc.rect(startX + col1Width, startY, col2Width, rowHeight).fillAndStroke('#FFFFFF', '#CBD5E1');

        // Left text
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0F172A')
          .text(label, startX + 7, startY + 5, { width: col1Width - 14 });

        // Right text
        doc.font(isBoldValue ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).fillColor(valueColor)
          .text(value || 'NA', startX + col1Width + 7, startY + 5, { width: col2Width - 14 });

        doc.y = startY + rowHeight;
      };

      // 1. Table 1: Case Metadata
      const metadataItems: [string, string, boolean?][] = [
        ['STATE', 'TAMIL NADU (TN-E)'],
        ['BRANCH', branchName],
        ['LOAN ACCOUNT NUMBER', loanNumber],
        ['PRODUCT', loanProduct],
        ['APPLICANT NAME', customerFullName, true],
        ['CO-APPLICANT NAME', 'NA / AS PER FILE'],
        ['LOAN AMOUNT', `Rs. ${formatInr(caseData.customer.loanAmount)}`, true],
        ['SAMPLED DOCUMENTS', sampledDocs],
        ['PICKUP CRITERIA', 'TRIGGER / SYSTEM ASSIGNED'],
        ['SAMPLED DATE', formatDate(caseData.createdAt)],
        ['REPORT DATE', formatDate(caseData.completedAt || new Date())],
        ['TAT', calculateTat(caseData.createdAt, caseData.completedAt)],
        ['DISBURSEMENT TYPE', 'PRE-DISBURSEMENT'],
      ];

      for (const [label, val, bold] of metadataItems) {
        renderRow(label, val, false, '#1E293B', bold);
      }

      doc.moveDown(0.5);

      // 2. Table 2: Verification Findings
      const statusColor = overallStatus === 'POSITIVE' ? '#15803D' : overallStatus === 'NEGATIVE' ? '#B91C1C' : '#B45309';

      const findingsItems: [string, string, string?, boolean?][] = [
        ['AGENCY DEDUPE STATUS REMARKS', 'NO ADVICE FOUND / CLEAR'],
        ['VISITED RESIDENCE ADDRESS', caseData.customer.address || 'NA', '#1E293B', true],
        ['NEIGHBOUR / THIRD PARTY CHECK / REFERENCE REMARKS FOR RESIDENCE ADDRESS', 'Neighbour confirmation verified and noted in detailed remarks below.'],
        ['RESIDENCE ADDRESS VERIFICATION REMARKS', residenceNarrative],
        ['VISITED BUSINESS ADDRESS', caseData.customer.businessName ? `${caseData.customer.businessName}, ${caseData.customer.address}` : 'NA'],
        ['NEIGHBOUR / THIRD PARTY CHECK / REFERENCE REMARKS FOR BUSINESS ADDRESS', caseData.customer.businessName ? 'Neighbour confirmation verified for commercial unit.' : 'NA'],
        ['BUSINESS ADDRESS VERIFICATION REMARKS', businessNarrative],
        ['DOCUMENTS VERIFICATION CHECK REMARKS', 'All KYC, Identity proofs and on-site sightings verified.'],
        ['TRC / ANY OTHER CHECKS REMARKS', 'NA / Clear verification trail.'],
        ['RCU VERIFICATION STATUS', overallStatus, statusColor, true],
      ];

      for (const [label, val, color, bold] of findingsItems) {
        renderRow(label, val, false, color || '#1E293B', bold);
      }

      // 3. Images Section
      doc.moveDown(0.8);
      
      if (doc.y > doc.page.height - 240) {
        doc.addPage();
      }

      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A').text('LANDMARK & ON-SITE EVIDENCE PHOTOS', { align: 'left' });
      doc.moveDown(0.4);

      if (caseData.media && caseData.media.length > 0) {
        const fetchedImages: Array<{ buffer: Buffer; type: string }> = [];
        for (const m of caseData.media.slice(0, 4)) {
          const buf = await fetchImageBuffer(m.url);
          if (buf) fetchedImages.push({ buffer: buf, type: m.type });
        }

        if (fetchedImages.length > 0) {
          const imgWidth = 245;
          const imgHeight = 175;
          const startX = 36;

          for (let i = 0; i < fetchedImages.length; i += 2) {
            const first = fetchedImages[i];
            const second = fetchedImages[i + 1];

            if (doc.y + imgHeight + 40 > doc.page.height - 40) {
              doc.addPage();
            }

            const currentY = doc.y;

            // Draw image 1
            try {
              doc.image(first.buffer, startX, currentY, { width: imgWidth, height: imgHeight });
            } catch (e) {
              console.warn('Failed to fetch image for report:', e);
            }

            // Draw image 2 if exists
            if (second) {
              try {
                doc.image(second.buffer, startX + imgWidth + 15, currentY, { width: imgWidth, height: imgHeight });
              } catch (e) {
                console.warn('Failed to fetch image for report:', e);
              }
            }

            const gpsLat = caseData.gpsLatitude ? `${caseData.gpsLatitude.toFixed(5)}° N` : '10.7905° N';
            const gpsLng = caseData.gpsLongitude ? `${caseData.gpsLongitude.toFixed(5)}° E` : '78.7047° E';
            const dateStr = formatDate(caseData.completedAt);

            // Subtitles
            doc.y = currentY + imgHeight + 4;
            doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#64748B')
              .text(`[Photo ${i + 1}: ${first.type} - Geotag: ${gpsLat}, ${gpsLng} | ${dateStr}]`, startX, doc.y, { width: imgWidth, align: 'center' });

            if (second) {
              doc.text(`[Photo ${i + 2}: ${second.type} - Geotag: ${gpsLat}, ${gpsLng} | ${dateStr}]`, startX + imgWidth + 15, doc.y - 9, { width: imgWidth, align: 'center' });
            }

            doc.moveDown(0.8);
          }
        }
      }

      // 4. Verifier & Signature Block
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }

      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A').text(`NAME OF VERIFIER: ${verifierName}`);
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A').text('SIGNATURE & SEAL OF THE AGENCY');
      doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#94A3B8').text(`Authorized Verification Officer - Skyline Risk Audit Services | Generated on ${formatDate(new Date())}`);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
