import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
});

// Auto-logout on 401/403 — redirect to correct login page based on current path
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("lvms_user");
      localStorage.removeItem("lvms_agent");
      const isAgentPath = window.location.pathname.startsWith("/agent");
      window.location.href = isAgentPath ? "/agent/login" : "/login";
    }
    return Promise.reject(error);
  }
);

export default api;


// ─── Auth ─────────────────────────────────────────────────────────────────
export const loginApi = (email: string, password: string) =>
  api.post("/auth/login", { email, password });

// ─── Dashboard ────────────────────────────────────────────────────────────
export const getDashboardApi = () => api.get("/admin/dashboard");
export const getAnalyticsApi = () => api.get("/admin/analytics");

// ─── Agents ───────────────────────────────────────────────────────────────
export const getAgentsApi = () => api.get("/admin/agents");
export const registerAgentApi = (data: {
  email: string; password: string;
  firstName: string; lastName: string;
  phone?: string; branch?: string;
}) => api.post("/admin/agents/register", data);
export const toggleAgentStatusApi = (agentId: string) =>
  api.patch(`/admin/agents/${agentId}/toggle`);
export const updateAgentApi = (agentId: string, data: {
  email: string; password?: string;
  firstName: string; lastName: string;
  phone?: string; branch?: string;
}) => api.put(`/admin/agents/${agentId}`, data);

// ─── Admins ───────────────────────────────────────────────────────────────
export const getAdminsApi = () => api.get("/admin/admins");
export const registerAdminApi = (data: {
  email: string; password: string;
  firstName: string; lastName: string;
  phone?: string; branch?: string;
}) => api.post("/admin/admins/register", data);

// ─── Customers ────────────────────────────────────────────────────────────
export const getCustomersApi = () => api.get("/admin/customers");
export const createCustomerApi = (data: {
  firstName: string; lastName: string;
  email?: string; phone?: string; address: string;
  loanAmount: number; businessName?: string;
  loanType?: string; type?: string; branch?: string;
}) => api.post("/admin/customers", data);

// ─── Cases ────────────────────────────────────────────────────────────────
export const getCasesApi = (status?: string) => api.get(`/admin/cases${status && status !== "All" ? `?status=${status}` : ""}`);
export const getCaseByIdAdminApi = (caseId: string) => api.get(`/admin/cases/${caseId}`);
export const assignCaseApi = (caseId: string, agentId: string) => api.put(`/admin/cases/${caseId}/assign`, { agentId });
export const assignBulkCasesApi = (caseIds: string[], agentId: string) => api.put(`/admin/cases/bulk-assign`, { caseIds, agentId });
export const updateCaseStatusApi = (caseId: string, status: string) => api.put(`/admin/cases/${caseId}/status`, { status });
export const uploadBulkCasesApi = (fileName: string, rows: any[]) =>
  api.post("/admin/upload/bulk", { fileName, rows });

export const getBatchStatusApi = (batchId: string) =>
  api.get(`/admin/upload/batch/${batchId}`);

// ─── Branches ─────────────────────────────────────────────────────────────
export const getBranchesApi = () => api.get("/admin/branches");
export const createBranchApi = (data: {
  name: string; city: string; manager: string; phone?: string;
}) => api.post("/admin/branches", data);

// ─── Reports ──────────────────────────────────────────────────────────────
export const getReportsApi = () => api.get("/admin/reports");
export const getReportMetricsApi = (timeframe: string) => api.get(`/admin/reports/metrics?timeframe=${timeframe}`);
export const generateReportApi = (data: {
  reportType: string; format: string; dateRange?: string;
}) => api.post("/admin/reports/generate", data);

// ─── Audit Logs ───────────────────────────────────────────────────────────
export const getAuditLogsApi = () => api.get("/admin/audit-logs");

// ─── Profile & Settings ───────────────────────────────────────────────────
export const getProfileApi = () => api.get("/admin/profile");
export const getSettingsApi = () => api.get("/admin/settings");
export const updateSettingsApi = (data: any) => api.put("/admin/settings", data);

// ─── Agent Panel APIs ──────────────────────────────────────────────────────
export const agentLoginApi = (email: string, password: string) =>
  api.post("/auth/login", { email, password });

export const agentLogoutApi = () =>
  api.post("/auth/logout");

export const getAgentDashboardApi = () =>
  api.get("/agent/dashboard");

export const getAgentCasesApi = (status?: string) =>
  api.get("/agent/cases", { params: status && status !== "All" ? { status } : {} });

export const getAgentCaseByIdApi = (id: string) =>
  api.get(`/agent/cases/${id}`);

export const uploadEvidenceApi = (caseId: string, formData: FormData) =>
  api.post(`/agent/cases/${caseId}/evidence`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateAgentCaseStatusApi = (id: string, status: string) =>
  api.patch(`/agent/cases/${id}/status`, { status });

export const submitVerificationApi = (id: string, data: {
  remarks?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  profileData?: any;
}) => api.post(`/agent/cases/${id}/submit`, data);

export const getAgentProfileApi = () =>
  api.get("/agent/profile");

export const getAgentNotificationsApi = () =>
  api.get("/agent/notifications");

// ─── Agent Ride Tracking ───────────────────────────────────────────────────
export const startRideApi = () =>
  api.post("/agent/rides/start");
export const endRideApi = (rideId: string) =>
  api.post("/agent/rides/end", { rideId });
export const logLocationPingApi = (data: { rideId: string; latitude: number; longitude: number; speed?: number }) =>
  api.post("/agent/rides/ping", data);

// ─── Admin Tracking Map ───────────────────────────────────────────────────
export const getActiveRidesApi = () =>
  api.get("/admin/tracking/active");
export const getRideHistoryApi = (rideId: string) =>
  api.get(`/admin/tracking/history/${rideId}`);

// ─── Admin Verification APIs ───────────────────────────────────────────────
export const getCompletedCasesApi = () =>
  api.get("/admin/verification");

export const getVerificationDetailApi = (caseId: string) =>
  api.get(`/admin/verification/${caseId}`);

export const reviewCaseApi = (caseId: string, data: {
  decision: "APPROVED" | "REJECTED" | "NEEDS_REVISION";
  adminRemarks?: string;
}) => api.post(`/admin/verification/${caseId}/review`, data);
