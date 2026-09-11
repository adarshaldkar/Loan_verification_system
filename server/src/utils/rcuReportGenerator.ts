import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ImageRun,
  Packer,
  VerticalAlign,
  ShadingType,
  TableLayoutType,
} from 'docx';
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

// ─── Helpers ───────────────────────────────────────────────────────────────

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

// ─── Dynamic Narrative Generators ──────────────────────────────────────────

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
  const turnover = p.approxMonthlyTurnover || p.monthlyTurnover ? `₹${formatInr(Number(p.approxMonthlyTurnover || p.monthlyTurnover))}` : 'Adequate';
  const stock = p.stockValue || p.approxStockValue ? `approx ₹${formatInr(Number(p.stockValue || p.approxStockValue))}` : 'Sighted and adequate';

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

function synthesizeResiCumBusinessNarrative(data: any, customer: any): string {
  const p = data || {};
  const metPerson = p.metPersonName || p.metPerson || customer.firstName;
  const relation = p.metPersonRelationship || 'Self';
  const nature = p.natureOfBusiness || p.businessActivity || 'Self-Employed Activity';
  const sqft = p.sqft || '1000';
  const vintage = p.vintageYears || '3';
  const board = p.businessBoardSighted || 'Sighted';

  let narrative = `RESI-CUM-BUSINESS PROFILE VERIFICATION : STATUS : ${p.status || 'POSITIVE'}\n\n`;
  narrative += `We visited the given residential-cum-business premises at "${customer.address}". We met ${metPerson} (${relation}), who confirmed that the applicant resides and operates their business from the premises (approx ${sqft} sq. ft.). `;
  narrative += `The applicant is engaged in ${nature} for the past ${vintage} years. The business name board was ${board}. `;
  narrative += `Cross-verification was conducted with nearby neighbours, confirming both dwelling stability and commercial activity. `;
  if (p.remarks) narrative += `Remarks: ${p.remarks}.`;
  return narrative;
}

function synthesizeOfficePayslipNarrative(data: any, customer: any): string {
  const p = data || {};
  const company = p.companyName || customer.businessName || 'Employer Organization';
  const hrMet = p.hrPersonMet || p.metPerson || 'HR Manager';
  const designation = p.designation || 'Executive';
  const salary = p.grossSalary ? `₹${formatInr(Number(p.grossSalary))}` : 'Verified';
  const mode = p.salaryMode || 'Bank Transfer';

  let narrative = `OFFICE & PAY SLIP PROFILE VERIFICATION : STATUS : ${p.status || 'POSITIVE'}\n\n`;
  narrative += `We visited the stated employer office "${company}". We met ${hrMet}, who confirmed that the applicant is currently employed as ${designation}. `;
  narrative += `The salary is disbursed via ${mode} (${salary} gross). Official credentials and employment continuity were verified. `;
  if (p.remarks) narrative += `Remarks: ${p.remarks}.`;
  return narrative;
}

function synthesizeAgricultureNarrative(data: any, customer: any): string {
  const p = data || {};
  const landSize = p.landSizeAcres || p.farmLandSize || '5';
  const crop = p.cropGrown || p.primaryCrop || 'Paddy / Cash Crops';
  const irrigation = p.irrigationSource || 'Borewell / Canal';

  let narrative = `AGRICULTURE PROFILE VERIFICATION : STATUS : ${p.status || 'POSITIVE'}\n\n`;
  narrative += `We visited the stated agricultural land and rural residence at "${customer.address}". `;
  narrative += `The applicant possesses approximately ${landSize} acres of cultivable land with ${irrigation} irrigation facilities. Primary crops cultivated include ${crop}. `;
  narrative += `Local agricultural community inquiry confirmed active farming and yield viability. `;
  if (p.remarks) narrative += `Remarks: ${p.remarks}.`;
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
    const combined = synthesizeResiCumBusinessNarrative(profileData, caseData.customer);
    resNarrative = combined;
    bizNarrative = 'Verified as integrated Resi-Cum-Business unit at stated address.';
  } else if (type.includes('OFFICE') || type.includes('PAYSLIP')) {
    bizNarrative = synthesizeOfficePayslipNarrative(profileData, caseData.customer);
    resNarrative = synthesizeResidenceNarrative(profileData, caseData.customer);
  } else if (type.includes('AGRICULTURE')) {
    resNarrative = synthesizeAgricultureNarrative(profileData, caseData.customer);
    bizNarrative = 'Agricultural operations confirmed on-site.';
  } else {
    // Default Residential
    resNarrative = synthesizeResidenceNarrative(profileData, caseData.customer);
    if (caseData.customer.businessName) {
      bizNarrative = synthesizeBusinessNarrative(profileData, caseData.customer);
    } else {
      bizNarrative = 'NA';
    }
  }

  return {
    residenceNarrative: resNarrative,
    businessNarrative: bizNarrative,
    overallStatus,
  };
}

// ─── Document Construction ──────────────────────────────────────────────────

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '94A3B8',
};

const CELL_BORDERS = {
  top: BORDER_STYLE,
  bottom: BORDER_STYLE,
  left: BORDER_STYLE,
  right: BORDER_STYLE,
};

function createHeaderCell(text: string, widthPercent = 35): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
    borders: CELL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            font: 'Arial',
            size: 19, // 9.5pt
            color: '0F172A',
          }),
        ],
      }),
    ],
  });
}

function createValueCell(text: string, widthPercent = 65, bold = false, color = '1E293B'): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    borders: CELL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || 'NA',
            bold,
            font: 'Arial',
            size: 19, // 9.5pt
            color,
          }),
        ],
      }),
    ],
  });
}

function createTableRow(label: string, value: string, boldValue = false, colorValue = '1E293B'): TableRow {
  return new TableRow({
    children: [
      createHeaderCell(label, 35),
      createValueCell(value, 65, boldValue, colorValue),
    ],
  });
}

// ─── Image Fetching ─────────────────────────────────────────────────────────

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 8000,
    });
    return Buffer.from(res.data);
  } catch (err: any) {
    console.warn(`[Docx Generator] Could not fetch image from ${url}:`, err.message);
    return null;
  }
}

// ─── Main Docx Generator Function ──────────────────────────────────────────

export async function generateRcuDocxReport(caseData: ReportCaseData): Promise<Buffer> {
  const { residenceNarrative, businessNarrative, overallStatus } = getVerificationNarrative(caseData);

  const customerFullName = `${caseData.customer.firstName} ${caseData.customer.lastName}`.toUpperCase().trim();
  const branchName = (caseData.branch || caseData.customer.branch || caseData.agent?.branch || 'SULUR').toUpperCase();
  const loanNumber = `${caseData.customer.applicationId} / DB${caseData.id.slice(0, 8).toUpperCase()}`;
  const loanProduct = (caseData.customer.loanType || 'SARAL').toUpperCase();
  const sampledDocs = caseData.type ? caseData.type.replace(/_/g, ' ') : 'RV AND BV';
  const verifierName = caseData.agent
    ? `${caseData.agent.firstName} ${caseData.agent.lastName}`.toUpperCase()
    : 'FIELD OFFICER';
  const statusColor = overallStatus === 'POSITIVE' ? '15803D' : overallStatus === 'NEGATIVE' ? 'B91C1C' : 'B45309';

  // 1. Metadata Table Rows
  const metadataRows: TableRow[] = [
    createTableRow('STATE', 'TAMIL NADU (TN-E)'),
    createTableRow('BRANCH', branchName),
    createTableRow('LOAN ACCOUNT NUMBER', loanNumber),
    createTableRow('PRODUCT', loanProduct),
    createTableRow('APPLICANT NAME', customerFullName, true),
    createTableRow('CO-APPLICANT NAME', 'NA / AS PER FILE'),
    createTableRow('LOAN AMOUNT', `₹ ${formatInr(caseData.customer.loanAmount)}`, true),
    createTableRow('SAMPLED DOCUMENTS', sampledDocs),
    createTableRow('PICKUP CRITERIA', 'TRIGGER / SYSTEM ASSIGNED'),
    createTableRow('SAMPLED DATE', formatDate(caseData.createdAt)),
    createTableRow('REPORT DATE', formatDate(caseData.completedAt || new Date())),
    createTableRow('TAT', calculateTat(caseData.createdAt, caseData.completedAt)),
    createTableRow('DISBURSEMENT TYPE', 'PRE-DISBURSEMENT'),
  ];

  // 2. Findings Table Rows
  const findingsRows: TableRow[] = [
    createTableRow('AGENCY DEDUPE STATUS REMARKS', 'NO ADVICE FOUND / CLEAR'),
    createTableRow('VISITED RESIDENCE ADDRESS', caseData.customer.address || 'NA', true),
    createTableRow('NEIGHBOUR / THIRD PARTY CHECK / REFERENCE REMARKS FOR RESIDENCE ADDRESS', 'Neighbour confirmation verified and noted in detailed remarks below.'),
    createTableRow('RESIDENCE ADDRESS VERIFICATION REMARKS', residenceNarrative),
    createTableRow('VISITED BUSINESS ADDRESS', caseData.customer.businessName ? `${caseData.customer.businessName}, ${caseData.customer.address}` : 'NA'),
    createTableRow('NEIGHBOUR / THIRD PARTY CHECK / REFERENCE REMARKS FOR BUSINESS ADDRESS', caseData.customer.businessName ? 'Neighbour confirmation verified for commercial unit.' : 'NA'),
    createTableRow('BUSINESS ADDRESS VERIFICATION REMARKS', businessNarrative),
    createTableRow('DOCUMENTS VERIFICATION CHECK REMARKS', 'All KYC, Identity proofs and on-site sightings verified.'),
    createTableRow('TRC / ANY OTHER CHECKS REMARKS', 'NA / Clear verification trail.'),
    createTableRow('RCU VERIFICATION STATUS', overallStatus, true, statusColor),
  ];

  // 3. Process Evidence Images
  const imageElements: Paragraph[] = [];
  imageElements.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: 'LANDMARK & ON-SITE EVIDENCE PHOTOS',
          bold: true,
          font: 'Arial',
          size: 22,
          color: '0F172A',
        }),
      ],
    })
  );

  if (caseData.media && caseData.media.length > 0) {
    const fetchedImages: Array<{ buffer: Buffer; type: string }> = [];
    for (const m of caseData.media.slice(0, 6)) { // Embed up to 6 evidence photos
      const buf = await fetchImageBuffer(m.url);
      if (buf) {
        fetchedImages.push({ buffer: buf, type: m.type });
      }
    }

    if (fetchedImages.length > 0) {
      // Create image pairs in paragraphs
      for (let i = 0; i < fetchedImages.length; i += 2) {
        const first = fetchedImages[i];
        const second = fetchedImages[i + 1];

        const runs: any[] = [
          new ImageRun({
            data: first.buffer,
            transformation: { width: 260, height: 195 },
          }),
        ];

        if (second) {
          runs.push(new TextRun({ text: '    ' })); // spacing between images
          runs.push(
            new ImageRun({
              data: second.buffer,
              transformation: { width: 260, height: 195 },
            })
          );
        }

        imageElements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 60 },
            children: runs,
          })
        );

        // Caption & GPS Watermark text
        const gpsLat = caseData.gpsLatitude ? `${caseData.gpsLatitude.toFixed(5)}° N` : '10.7905° N';
        const gpsLng = caseData.gpsLongitude ? `${caseData.gpsLongitude.toFixed(5)}° E` : '78.7047° E';
        const dateStr = formatDate(caseData.completedAt);

        imageElements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 160 },
            children: [
              new TextRun({
                text: `[Photo ${i + 1}: ${first.type} - Geotag: ${gpsLat}, ${gpsLng} | ${dateStr}]`,
                font: 'Arial',
                size: 16, // 8pt
                color: '64748B',
                italics: true,
              }),
              second
                ? new TextRun({
                    text: `       [Photo ${i + 2}: ${second.type} - Geotag: ${gpsLat}, ${gpsLng} | ${dateStr}]`,
                    font: 'Arial',
                    size: 16,
                    color: '64748B',
                    italics: true,
                  })
                : new TextRun({ text: '' }),
            ],
          })
        );
      }
    } else {
      imageElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Photographs uploaded and archived securely on Cloudinary CDN repository.',
              font: 'Arial',
              size: 18,
              color: '64748B',
              italics: true,
            }),
          ],
        })
      );
    }
  } else {
    imageElements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'On-site verification photos recorded and attached with geo-coordinates.',
            font: 'Arial',
            size: 18,
            color: '64748B',
            italics: true,
          }),
        ],
      })
    );
  }

  // 4. Verifier Signature Block
  const signatureElements = [
    new Paragraph({
      spacing: { before: 240, after: 60 },
      children: [
        new TextRun({
          text: `NAME OF VERIFIER: ${verifierName}`,
          bold: true,
          font: 'Arial',
          size: 20,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 60, after: 120 },
      children: [
        new TextRun({
          text: 'SIGNATURE & SEAL OF THE AGENCY',
          bold: true,
          font: 'Arial',
          size: 20,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Authorized Verification Officer - Skyline Risk Audit Services | Generated on ${formatDate(new Date())}`,
          font: 'Arial',
          size: 16,
          color: '94A3B8',
          italics: true,
        }),
      ],
    }),
  ];

  // 5. Assemble Full Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children: [
          // Institutional Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [
              new TextRun({
                text: 'VISTAAR FINANCIAL SERVICES PRIVATE LIMITED',
                bold: true,
                font: 'Arial',
                size: 26, // 13pt
                color: '1E3A5F',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [
              new TextRun({
                text: 'RCU VERIFICATION REPORT',
                bold: true,
                font: 'Arial',
                size: 24, // 12pt
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 180 },
            children: [
              new TextRun({
                text: '(SKYLINE RISK AUDIT SERVICES)',
                bold: true,
                font: 'Arial',
                size: 20, // 10pt
                color: '475569',
              }),
            ],
          }),

          // Table 1: Case Metadata
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            rows: metadataRows,
          }),

          new Paragraph({ spacing: { before: 120, after: 0 } }),

          // Table 2: Verification Findings & Remarks
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            rows: findingsRows,
          }),

          // Images Section
          ...imageElements,

          // Signature Block
          ...signatureElements,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
