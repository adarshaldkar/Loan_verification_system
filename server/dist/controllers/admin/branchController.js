"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBranch = exports.getBranches = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const getBranches = async (req, res) => {
    try {
        const [branches, agents, cases] = await Promise.all([
            db_1.default.branch.findMany({ orderBy: { createdAt: 'asc' } }),
            db_1.default.user.findMany({ where: { role: 'FIELD_AGENT' } }),
            db_1.default.verificationCase.findMany({ include: { agent: { select: { branch: true } } } }),
        ]);
        const data = branches.map((branch) => {
            const branchAgents = agents.filter((a) => a.branch === branch.name);
            const branchCases = cases.filter((c) => c.branch === branch.name || c.agent?.branch === branch.name);
            return {
                id: branch.id,
                name: branch.name,
                city: branch.city,
                agents: branchAgents.length,
                activeCases: branchCases.filter((c) => c.status !== 'COMPLETED' && c.status !== 'REJECTED').length,
                manager: branch.manager,
                phone: branch.phone ?? '—',
            };
        });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to load branches', 500, error);
    }
};
exports.getBranches = getBranches;
const createBranch = async (req, res) => {
    try {
        const adminId = req.user?.id;
        if (!adminId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { name, city, manager, phone } = req.body;
        if (!name || !city || !manager) {
            return res.status(400).json({ success: false, message: 'Name, city and manager are required' });
        }
        const created = await db_1.default.branch.create({ data: { name, city, manager, phone: phone || null, adminId } });
        await (0, helpers_1.createAuditLog)({
            actor: `Admin (${adminId})`,
            action: 'Created branch',
            entity: `Branch ${created.name}`,
            ip: req.ip || 'system',
            adminId,
        });
        return res.status(201).json({ success: true, message: 'Branch created successfully', data: created });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to create branch', 500, error);
    }
};
exports.createBranch = createBranch;
