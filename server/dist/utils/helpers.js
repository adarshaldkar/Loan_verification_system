"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFullName = exports.formatDateTime = exports.toTitleCase = exports.apiError = void 0;
exports.resolveAgentName = resolveAgentName;
exports.resolveCaseStatus = resolveCaseStatus;
exports.getClientIp = getClientIp;
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
function getClientIp(req) {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
        const ip = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
        if (ip && ip !== '::1' && ip !== '127.0.0.1' && !ip.startsWith('::ffff:127.0.0.1')) {
            return ip.replace(/^::ffff:/, '');
        }
    }
    const rawIp = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
    if (rawIp === '::1' || rawIp === '127.0.0.1' || rawIp === '::ffff:127.0.0.1') {
        return '127.0.0.1 (Local / Proxy)';
    }
    return rawIp.replace(/^::ffff:/, '');
}
// Helper to create audit log with adminId — uses 'as any' because Prisma client
// may not have the adminId field type yet until it is regenerated after db push
async function createAuditLog(data) {
    let cleanIp = data.ip || '127.0.0.1';
    if (cleanIp === '::1' || cleanIp === '127.0.0.1' || cleanIp === '::ffff:127.0.0.1') {
        cleanIp = '127.0.0.1 (Local / Proxy)';
    }
    else {
        cleanIp = cleanIp.replace(/^::ffff:/, '');
    }
    return db_1.default.auditLog.create({
        data: {
            actor: data.actor,
            action: data.action,
            entity: data.entity,
            timestamp: new Date().toISOString(),
            ip: cleanIp,
            adminId: data.adminId,
        },
    });
}
