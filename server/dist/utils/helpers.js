"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFullName = exports.formatDateTime = exports.toTitleCase = exports.apiError = void 0;
exports.resolveAgentName = resolveAgentName;
exports.resolveCaseStatus = resolveCaseStatus;
exports.createAuditLog = createAuditLog;
const db_1 = __importDefault(require("../config/db"));
const apiError = (res, message, status = 500, error) => res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'production' ? undefined : error?.message ?? error,
});
exports.apiError = apiError;
const toTitleCase = (value) => value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
exports.toTitleCase = toTitleCase;
const formatDateTime = (date) => new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
}).format(date);
exports.formatDateTime = formatDateTime;
const parseFullName = (firstName, lastName) => `${firstName} ${lastName}`.trim();
exports.parseFullName = parseFullName;
function resolveAgentName(agent) {
    return agent ? (0, exports.parseFullName)(agent.firstName, agent.lastName) : 'Not Assigned';
}
function resolveCaseStatus(status) {
    return (0, exports.toTitleCase)(status.replace('_', ' '));
}
// Helper to create audit log with adminId — uses 'as any' because Prisma client
// may not have the adminId field type yet until it is regenerated after db push
async function createAuditLog(data) {
    return db_1.default.auditLog.create({
        data: {
            actor: data.actor,
            action: data.action,
            entity: data.entity,
            timestamp: new Date().toISOString(),
            ip: data.ip,
            adminId: data.adminId,
        },
    });
}
