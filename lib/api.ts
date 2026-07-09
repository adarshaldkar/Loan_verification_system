import axios, { InternalAxiosRequestConfig, AxiosResponse } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Auto-attach JWT to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("lvms_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("lvms_token");
      localStorage.removeItem("lvms_user");
      window.location.href = "/login";
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

// ─── Customers ────────────────────────────────────────────────────────────
export const getCustomersApi = () => api.get("/admin/customers");
export const createCustomerApi = (data: {
  firstName: string; lastName: string;
  email?: string; phone?: string; address: string;
  loanAmount: number; businessName?: string;
  loanType?: string; type?: string; branch?: string;
}) => api.post("/admin/customers", data);

// ─── Cases ────────────────────────────────────────────────────────────────
export const getCasesApi = (status?: string) =>
  api.get("/admin/cases", { params: status && status !== "All" ? { status } : {} });
export const assignCaseApi = (caseId: string, agentId: string) =>
  api.put(`/admin/cases/${caseId}/assign`, { agentId });
export const updateCaseStatusApi = (caseId: string, status: "COMPLETED" | "REJECTED") =>
  api.put(`/admin/cases/${caseId}/status`, { status });
export const uploadBulkCasesApi = (rows: any[]) =>
  api.post("/admin/upload/bulk", { rows });

// ─── Branches ─────────────────────────────────────────────────────────────
export const getBranchesApi = () => api.get("/admin/branches");
export const createBranchApi = (data: {
  name: string; city: string; manager: string; phone?: string;
}) => api.post("/admin/branches", data);

// ─── Reports ──────────────────────────────────────────────────────────────
export const getReportsApi = () => api.get("/admin/reports");
export const generateReportApi = (data: {
  reportType: string; format: string; dateRange?: string;
}) => api.post("/admin/reports/generate", data);

// ─── Audit Logs ───────────────────────────────────────────────────────────
export const getAuditLogsApi = () => api.get("/admin/audit-logs");

// ─── Profile & Settings ───────────────────────────────────────────────────
export const getProfileApi = () => api.get("/admin/profile");
export const getSettingsApi = () => api.get("/admin/settings");
export const updateSettingsApi = (data: any) => api.put("/admin/settings", data);

// ─── Agent Endpoints ──────────────────────────────────────────────────────
export const getAgentCasesApi = () => api.get("/agent/cases");
export const getAgentCaseDetailsApi = (id: string) => api.get(`/agent/cases/${id}`);
export const updateAgentCaseStatusApi = (id: string, status: string) => api.put(`/agent/cases/${id}/status`, { status });
export const submitAgentVerificationApi = (id: string, data: {
  gpsLatitude?: number;
  gpsLongitude?: number;
  remarks?: string;
  profileData?: any;
  photos?: string[];
  status?: string;
}) => api.post(`/agent/cases/${id}/verify`, data);
