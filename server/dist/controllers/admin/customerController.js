"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomerAndCase = exports.getCustomers = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const geocoder_1 = require("../../utils/geocoder");
const getCustomers = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
        const whereClause = {};
        if (!isSuperAdmin) {
            whereClause.adminId = adminId;
        }
        const customers = await db_1.default.customer.findMany({
            where: whereClause,
            include: {
                verificationCases: {
                    include: {
                        agent: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                branch: true,
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const data = customers.map((customer) => {
            const latestCase = customer.verificationCases?.[0];
            return {
                id: customer.applicationId,
                customerId: customer.id,
                caseId: latestCase?.id || null,
                name: (0, helpers_1.parseFullName)(customer.firstName, customer.lastName),
                email: customer.email || '',
                phone: customer.phone ?? '',
                address: customer.address || '',
                loanType: customer.loanType || 'Personal Loan',
                loanAmount: customer.loanAmount || 0,
                businessName: customer.businessName || '',
                caseType: latestCase?.type || customer.loanType || 'RESIDENTIAL',
                caseStatus: (0, helpers_1.resolveCaseStatus)(latestCase?.status ?? 'PENDING'),
                assignedAgent: latestCase?.agent ? (0, helpers_1.parseFullName)(latestCase.agent.firstName, latestCase.agent.lastName) : 'Unassigned',
                branch: customer.branch ?? latestCase?.branch ?? latestCase?.agent?.branch ?? 'Unassigned',
                uploadDate: (0, helpers_1.formatDateTime)(customer.updatedAt || customer.createdAt),
            };
        });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load customers', 500, error);
    }
};
exports.getCustomers = getCustomers;
const createCustomerAndCase = async (req, res) => {
    try {
        const adminId = req.user?.id;
        if (!adminId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { firstName, lastName, email, phone, address, loanAmount, businessName, type, loanType, branch, addressLatitude: bodyLat, addressLongitude: bodyLng, addressAccuracy: bodyAcc } = req.body;
        let addrLat = bodyLat != null ? Number(bodyLat) : null;
        let addrLng = bodyLng != null ? Number(bodyLng) : null;
        let addrAcc = bodyAcc ?? null;
        if (addrLat == null || addrLng == null) {
            try {
                const r = await (0, geocoder_1.geocodeAddress)(String(address || '').trim());
                if (r.lat != null && r.lng != null) {
                    addrLat = r.lat;
                    addrLng = r.lng;
                    addrAcc = r.accuracy === 'unknown' ? null : r.accuracy;
                }
            }
            catch {
                // non-fatal — coordinates stay null
            }
        }
        const customer = await db_1.default.customer.create({
            data: {
                applicationId: `APP-${Date.now()}`,
                firstName,
                lastName,
                email,
                phone,
                address,
                loanAmount: Number(loanAmount),
                businessName,
                loanType: loanType || 'Home Loan',
                branch,
                adminId,
                verificationCases: {
                    create: {
                        type: type || 'RESIDENTIAL',
                        status: 'PENDING',
                        branch,
                        adminId,
                        addressLatitude: addrLat ?? undefined,
                        addressLongitude: addrLng ?? undefined,
                        addressAccuracy: addrAcc ?? undefined,
                    },
                },
            },
            include: { verificationCases: true },
        });
        await (0, helpers_1.createAuditLog)({
            actor: `Admin (${adminId})`,
            action: 'Created customer and case',
            entity: `Customer ${(0, helpers_1.parseFullName)(firstName, lastName)} (${customer.applicationId})`,
            ip: req.ip || 'system',
            adminId,
        });
        return res.status(201).json({ success: true, message: 'Customer and pending case created successfully', data: customer });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to create customer', 500, error);
    }
};
exports.createCustomerAndCase = createCustomerAndCase;
