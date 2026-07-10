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

// Helper to create audit log with adminId — uses 'as any' because Prisma client
// may not have the adminId field type yet until it is regenerated after db push
export async function createAuditLog(data: {
  actor: string;
  action: string;
  entity: string;
  ip: string;
  adminId?: string;
}) {
  return (prisma.auditLog as any).create({
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
