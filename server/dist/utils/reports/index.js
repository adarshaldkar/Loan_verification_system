"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOfficePayslipPdfReport = exports.generatePropertyPdfReport = exports.generateDsaPdfReport = exports.generateDealerPdfReport = exports.generateResiCumBusinessPdfReport = void 0;
exports.generateDynamicCasePdf = generateDynamicCasePdf;
const resiCumBusinessPdfGenerator_1 = require("./resiCumBusinessPdfGenerator");
Object.defineProperty(exports, "generateResiCumBusinessPdfReport", { enumerable: true, get: function () { return resiCumBusinessPdfGenerator_1.generateResiCumBusinessPdfReport; } });
const dealerPdfGenerator_1 = require("./dealerPdfGenerator");
Object.defineProperty(exports, "generateDealerPdfReport", { enumerable: true, get: function () { return dealerPdfGenerator_1.generateDealerPdfReport; } });
const dsaPdfGenerator_1 = require("./dsaPdfGenerator");
Object.defineProperty(exports, "generateDsaPdfReport", { enumerable: true, get: function () { return dsaPdfGenerator_1.generateDsaPdfReport; } });
const propertyPdfGenerator_1 = require("./propertyPdfGenerator");
Object.defineProperty(exports, "generatePropertyPdfReport", { enumerable: true, get: function () { return propertyPdfGenerator_1.generatePropertyPdfReport; } });
const officePayslipPdfGenerator_1 = require("./officePayslipPdfGenerator");
Object.defineProperty(exports, "generateOfficePayslipPdfReport", { enumerable: true, get: function () { return officePayslipPdfGenerator_1.generateOfficePayslipPdfReport; } });
const rcuPdfReportGenerator_1 = require("../rcuPdfReportGenerator");
/**
 * Master PDF Dispatcher:
 * Dynamically selects and executes the exact PDF report template matching
 * the specific verification profile type of the case.
 */
async function generateDynamicCasePdf(caseData) {
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
        }
        catch {
            // fallback to caseType
        }
    }
    // 1. Residential Cum Business Profile (Matches Agent profile report 1.doc)
    if (profileCode === 'RESI_CUM_BUSINESS' || profileCode === 'DSA_RESI_CUM_BUSINESS' || caseType === 'RESI_CUM_BUSINESS') {
        return await (0, resiCumBusinessPdfGenerator_1.generateResiCumBusinessPdfReport)(caseData);
    }
    // 2. Dealer Verification - Business Profile (Matches Dealer profile report - CD 1.doc & Dealer Profile Report - TW DSA.doc)
    if (profileCode === 'DEALERS' || profileCode === 'DEALER' || profileCode === 'DEALER_CD' || profileCode === 'DEALER_TW' || caseType === 'DEALERS') {
        return await (0, dealerPdfGenerator_1.generateDealerPdfReport)(caseData);
    }
    // 3. DSA Vendor & Loan Asset Verification (Matches DSA Report format.doc & AP-10558407 - K GANAPATHI.docx)
    if (profileCode === 'DSA_BUSINESS' ||
        profileCode === 'DSA' ||
        profileCode === 'DSA_RESIDENTIAL' ||
        profileCode === 'LOAN_ASSET_VERIFICATION' ||
        profileCode === 'ASSET_VERIFICATION' ||
        profileCode === 'ASSET' ||
        profileCode === 'LOAN_ASSET' ||
        profileCode === 'CD_LOAN_ASSET' ||
        profileCode === 'CONNECTOR' ||
        caseType === 'DSA_BUSINESS' ||
        caseType === 'LOAN_ASSET_VERIFICATION' ||
        caseType === 'ASSET_VERIFICATION' ||
        caseType === 'CD_LOAN_ASSET') {
        return await (0, dsaPdfGenerator_1.generateDsaPdfReport)(caseData);
    }
    // 4. Property Profile & Seller Verification (Matches SIVA SAKTHI SHELTERS.pdf & Report - PRABHAKHAR D.docx)
    if (profileCode === 'PROPERTY' ||
        profileCode === 'SELLER' ||
        profileCode === 'PROPERTY_VALUATION' ||
        profileCode === 'SITE_SURVEY' ||
        caseType === 'PROPERTY' ||
        caseType === 'SELLER') {
        return await (0, propertyPdfGenerator_1.generatePropertyPdfReport)(caseData);
    }
    // 5. Office & Pay Slip Verification (Matches 1410041 -Mohan Kuzhandaivel.docx)
    if (profileCode === 'OFFICE_PAYSLIP' ||
        profileCode === 'OFFICE' ||
        profileCode === 'PAYSLIP' ||
        profileCode === 'SALARIED' ||
        caseType === 'OFFICE_PAYSLIP') {
        return await (0, officePayslipPdfGenerator_1.generateOfficePayslipPdfReport)(caseData);
    }
    // Fallback to standard/residential RCU generator for now
    return await (0, rcuPdfReportGenerator_1.generateRcuPdfReport)(caseData);
}
