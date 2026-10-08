import { Response } from 'express';
import prisma from '../config/db';

export const apiError = (res: Response, message: string, status = 500, error?: any) =>
  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'production' ? undefined : error?.message ?? error,
  });

export const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

export const parseFullName = (firstName: string, lastName: string) => `${firstName} ${lastName}`.trim();

export function resolveAgentName(agent: { firstName: string; lastName: string } | null) {
  return agent ? parseFullName(agent.firstName, agent.lastName) : 'Not Assigned';
}

export function resolveCaseStatus(status: string) {
  return toTitleCase(status.replace('_', ' '));
}

export function getClientIp(req: any): string {
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
export async function createAuditLog(data: {
  actor: string;
  action: string;
  entity: string;
  ip: string;
  adminId?: string;
}) {
  let cleanIp = data.ip || '127.0.0.1';
  if (cleanIp === '::1' || cleanIp === '127.0.0.1' || cleanIp === '::ffff:127.0.0.1') {
    cleanIp = '127.0.0.1 (Local / Proxy)';
  } else {
    cleanIp = cleanIp.replace(/^::ffff:/, '');
  }

  return (prisma.auditLog as any).create({
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
