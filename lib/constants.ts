// ─── Roles ─────────────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  FIELD_AGENT: 'FIELD_AGENT',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// ─── Case Statuses ─────────────────────────────────────────────────────────
export const CASE_STATUS = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  COMPLETED: 'COMPLETED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  NEEDS_REVISION: 'NEEDS_REVISION',
} as const;

export type CaseStatus = typeof CASE_STATUS[keyof typeof CASE_STATUS];

// ─── Ride Statuses ─────────────────────────────────────────────────────────
export const RIDE_STATUS = {
  STARTED: 'STARTED',
  COMPLETED: 'COMPLETED',
} as const;

// ─── Verification Decisions ────────────────────────────────────────────────
export const VERIFICATION_DECISIONS = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  NEEDS_REVISION: 'NEEDS_REVISION',
} as const;

// ─── LocalStorage Keys ─────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  TOKEN: 'lvms_token',
  USER: 'lvms_user',
  AGENT: 'lvms_agent',
  THEME: 'theme',
  ORG: 'lvms_org',
  SUBMITTED_VERIFICATIONS: 'lvms_submitted_verifications',
} as const;

// ─── API Config ────────────────────────────────────────────────────────────
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  PING_INTERVAL_MS: 10000,
  ADMIN_POLL_INTERVAL_MS: 10000,
  GPS_MIN_DISTANCE_KM: 0.01,
  RIDE_DATA_CACHE_TTL: 300,
  RIDE_LATEST_CACHE_TTL: 600,
} as const;

// ─── Status Display Colors ─────────────────────────────────────────────────
export const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:         { label: 'Pending',     color: '#7C3AED', bg: '#EDE9FE' },
  ASSIGNED:        { label: 'Assigned',    color: '#1E3A5F', bg: '#EEF2FF' },
  TRAVELLING:      { label: 'Travelling',  color: '#7C3AED', bg: '#EDE9FE' },
  AT_LOCATION:     { label: 'At Location', color: '#0D9488', bg: '#CCFBF1' },
  IN_PROGRESS:     { label: 'In Progress', color: '#D97706', bg: '#FEF3C7' },
  SUBMITTED:       { label: 'Submitted',   color: '#2563EB', bg: '#DBEAFE' },
  COMPLETED:       { label: 'Completed',   color: '#0D9488', bg: '#CCFBF1' },
  APPROVED:        { label: 'Approved',    color: '#0D9488', bg: '#CCFBF1' },
  RE_VERIFICATION: { label: 'Re-verify',   color: '#DC2626', bg: '#FEE2E2' },
  REJECTED:        { label: 'Rejected',    color: '#DC2626', bg: '#FEE2E2' },
  NEEDS_REVISION:  { label: 'Needs Revision', color: '#D97706', bg: '#FEF3C7' },
};

// ─── Valid Status Updates (what each role can set) ─────────────────────────
export const VALID_AGENT_STATUSES = ['IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'REJECTED'] as const;
export const VALID_ADMIN_STATUSES = ['COMPLETED', 'REJECTED', 'PENDING', 'IN_PROGRESS', 'ASSIGNED'] as const;

// ─── Dashboard Date Ranges (dynamic) ──────────────────────────────────────
export function getDateRanges() {
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const today = fmt(now);
  const last7 = fmt(new Date(now.getTime() - 7 * 86400000));
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return [
    { label: 'Today', value: today },
    { label: 'Last 7 days', value: `${last7} – ${today}` },
    { label: 'This Week', value: `${fmt(startOfWeek)} – ${fmt(endOfWeek)}` },
  ];
}
