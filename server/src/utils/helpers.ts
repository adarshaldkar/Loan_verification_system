import { Response } from 'express';

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
