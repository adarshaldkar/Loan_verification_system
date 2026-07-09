"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
// Keep-alive ping every 4 minutes to prevent Neon DB from auto-suspending
if (!globalForPrisma.keepAliveInterval) {
    globalForPrisma.keepAliveInterval = setInterval(async () => {
        try {
            await exports.prisma.$queryRaw `SELECT 1`;
        }
        catch (err) {
            console.error('[DB Keep-Alive] Ping failed:', err);
        }
    }, 4 * 60 * 1000); // every 4 minutes
}
exports.default = exports.prisma;
