"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiCheckCircle, FiXCircle, FiRefreshCw, FiDownload, FiMapPin,
  FiEye, FiFileText, FiHome, FiBriefcase, FiImage, FiUser,
  FiCalendar, FiDollarSign, FiChevronDown, FiX, FiSend,
  FiAlertCircle, FiClock, FiFilter, FiSearch, FiStar,
} from "react-icons/fi";
import { getCompletedCasesApi, getVerificationDetailApi, reviewCaseApi } from "@/lib/api";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface CaseSummary {
  id: string;
  customer: string;
  applicationId: string;
  type: "Residential" | "Business";
  status: string;
  agent: string;
  agentId: string;
  branch: string;
  submittedAt: string;
  loanAmount: number;
  loanType: string;
  address: string;
  mediaCount: number;
}

interface CaseDetail {
  id: string;
  customer: {
    name: string; applicationId: string; email: string; phone: string;
    address: string; loanAmount: number; loanType: string; businessName?: string;
  };
  type: string;
  status: string;
  agent: { name: string; id: string; email: string; phone: string; branch: string };
  branch: string;
  submittedAt: string;
  createdAt: string;
  geoTag: { latitude: number | null; longitude: number | null; hasLocation: boolean };
  remarks: string;
  profileData: Record<string, any> | null;
  media: { id: string; url: string; publicId: string; type: string; createdAt: string }[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const statusColor: Record<string, string> = {
  COMPLETED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
};

const decisionOptions = [
  { value: "APPROVED", label: "✅ Approve", color: "#10b981" },
  { value: "REJECTED", label: "❌ Reject", color: "#ef4444" },
  { value: "NEEDS_REVISION", label: "🔄 Needs Revision", color: "#f59e0b" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

/* ─── Field Renderer ─────────────────────────────────────────────────────── */
function FieldGrid({ data, title }: { data: Record<string, any>; title: string }) {
  const skip = ["adminReview", "photos", "type"];
  const entries = Object.entries(data).filter(([k]) => !skip.includes(k));
  if (!entries.length) return null;

  return (
    <div className="form-section">
      <h4 className="section-heading">{title}</h4>
      <div className="field-grid">
        {entries.map(([key, val]) => {
          if (typeof val === "object" || val === null || val === undefined) return null;
          const label = key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();
          return (
            <div key={key} className="field-item">
              <span className="field-label">{label}</span>
              <span className="field-value">{String(val) || "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error" | "info"; onClose: () => void }) {
  const bg = type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6";
  const Icon = type === "success" ? FiCheckCircle : type === "error" ? FiXCircle : FiAlertCircle;
  return (
    <div className="toast" style={{ background: bg }} onClick={onClose}>
      <Icon size={18} />
      <span>{msg}</span>
      <FiX size={16} className="toast-close" />
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function VerificationPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [filtered, setFiltered] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const [selectedCase, setSelectedCase] = useState<CaseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"geo" | "residential" | "business" | "photos">("geo");

  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | "NEEDS_REVISION" | "">("");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);

  /* Load cases */
  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCompletedCasesApi();
      setCases(res.data.data || []);
    } catch {
      showToast("Failed to load completed cases", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCases(); }, [loadCases]);

  /* Filter */
  useEffect(() => {
    let list = [...cases];
    if (search) list = list.filter(c =>
      c.customer.toLowerCase().includes(search.toLowerCase()) ||
      c.applicationId.toLowerCase().includes(search.toLowerCase()) ||
      c.agent.toLowerCase().includes(search.toLowerCase())
    );
    if (typeFilter !== "All") list = list.filter(c => c.type === typeFilter);
    setFiltered(list);
  }, [cases, search, typeFilter]);

  const showToast = (msg: string, type: "success" | "error" | "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  /* Open case detail */
  const openCase = async (id: string) => {
    setDetailLoading(true);
    setSelectedCase(null);
    setDecision("");
    setAdminRemarks("");
    setActiveTab("geo");
    try {
      const res = await getVerificationDetailApi(id);
      setSelectedCase(res.data.data);
    } catch {
      showToast("Failed to load case details", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  /* Submit review */
  const submitReview = async () => {
    if (!selectedCase || !decision) return;
    setSubmitting(true);
    try {
      const res = await reviewCaseApi(selectedCase.id, { decision, adminRemarks });
      showToast(res.data.message, "success");
      setSelectedCase(null);
      loadCases();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* Download report */
  const downloadReport = (c: CaseSummary | CaseDetail) => {
    const content = `LVMS — Verification Report
============================
Application ID : ${"customer" in c && typeof c.customer === "object" ? c.customer.applicationId : (c as CaseSummary).applicationId}
Customer       : ${"customer" in c && typeof c.customer === "object" ? c.customer.name : (c as CaseSummary).customer}
Type           : ${c.type}
Status         : ${c.status}
Submitted At   : ${c.submittedAt}
Generated At   : ${new Date().toLocaleString("en-IN")}
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LVMS_Case_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        /* ── Layout ── */
        .vp-wrap { min-height:100vh; background:#f8fafc; font-family:'Inter',sans-serif; }
        .vp-header { background:linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 60%,#1a7ab5 100%); padding:32px 32px 28px; }
        .vp-header h1 { font-size:1.75rem; font-weight:700; color:#fff; margin:0 0 4px; }
        .vp-header p  { font-size:.9rem; color:rgba(255,255,255,.72); margin:0; }
        .vp-body  { padding:28px 32px; max-width:1400px; margin:0 auto; }

        /* ── Toolbar ── */
        .toolbar { display:flex; gap:12px; align-items:center; margin-bottom:24px; flex-wrap:wrap; }
        .search-box { display:flex; align-items:center; gap:8px; background:#fff; border:1.5px solid #e2e8f0; border-radius:10px; padding:8px 14px; flex:1; min-width:240px; }
        .search-box input { border:none; outline:none; font-size:.875rem; color:#334155; width:100%; background:transparent; }
        .filter-btn { display:flex; align-items:center; gap:6px; background:#fff; border:1.5px solid #e2e8f0; border-radius:10px; padding:8px 14px; font-size:.875rem; color:#475569; cursor:pointer; white-space:nowrap; transition:.2s; }
        .filter-btn.active,.filter-btn:hover { border-color:#2d5a8e; color:#2d5a8e; background:#eff6ff; }
        .refresh-btn { display:flex; align-items:center; gap:6px; background:#2d5a8e; color:#fff; border:none; border-radius:10px; padding:9px 18px; font-size:.875rem; cursor:pointer; transition:.2s; }
        .refresh-btn:hover { background:#1e3a5f; }

        /* ── Stats ── */
        .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
        .stat-card { background:#fff; border-radius:14px; padding:18px 22px; border:1px solid #e2e8f0; }
        .stat-card .stat-num { font-size:1.6rem; font-weight:700; color:#1e3a5f; }
        .stat-card .stat-lbl { font-size:.8rem; color:#64748b; margin-top:2px; }

        /* ── Table ── */
        .table-card { background:#fff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; }
        .table-header { display:grid; grid-template-columns:2fr 1.2fr .9fr 1.5fr 1.4fr 1.2fr auto; gap:8px; padding:13px 20px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-size:.78rem; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
        .table-row { display:grid; grid-template-columns:2fr 1.2fr .9fr 1.5fr 1.4fr 1.2fr auto; gap:8px; padding:14px 20px; border-bottom:1px solid #f1f5f9; align-items:center; cursor:pointer; transition:.18s; }
        .table-row:hover { background:#f0f7ff; }
        .table-row:last-child { border-bottom:none; }
        .row-name { font-size:.875rem; font-weight:600; color:#1e293b; }
        .row-sub  { font-size:.75rem; color:#94a3b8; margin-top:1px; }
        .row-text { font-size:.82rem; color:#475569; }
        .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:.73rem; font-weight:600; }
        .actions-cell { display:flex; gap:6px; }
        .icon-btn { background:none; border:1px solid #e2e8f0; border-radius:8px; padding:6px; cursor:pointer; color:#64748b; transition:.15s; display:flex; align-items:center; }
        .icon-btn:hover { border-color:#2d5a8e; color:#2d5a8e; background:#eff6ff; }

        /* ── Detail Panel ── */
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:100; backdrop-filter:blur(3px); }
        .detail-panel { position:fixed; right:0; top:0; bottom:0; width:min(720px,97vw); background:#fff; z-index:101; display:flex; flex-direction:column; box-shadow:-8px 0 48px rgba(0,0,0,.15); overflow:hidden; }
        .panel-head { background:linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 100%); padding:22px 28px; display:flex; justify-content:space-between; align-items:flex-start; }
        .panel-head h2 { font-size:1.15rem; font-weight:700; color:#fff; margin:0 0 4px; }
        .panel-head p  { font-size:.8rem; color:rgba(255,255,255,.7); margin:0; }
        .close-btn { background:rgba(255,255,255,.15); border:none; color:#fff; border-radius:8px; padding:7px 10px; cursor:pointer; display:flex; align-items:center; transition:.2s; }
        .close-btn:hover { background:rgba(255,255,255,.3); }
        .panel-body { flex:1; overflow-y:auto; padding:0 28px 28px; }

        /* ── Info Cards ── */
        .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:22px; }
        .info-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; }
        .info-card h5 { font-size:.75rem; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.06em; margin:0 0 12px; display:flex; align-items:center; gap:6px; }
        .info-row  { display:flex; justify-content:space-between; margin-bottom:7px; font-size:.82rem; }
        .info-row .label { color:#94a3b8; }
        .info-row .value { color:#1e293b; font-weight:500; text-align:right; max-width:55%; word-break:break-word; }

        /* ── Tabs ── */
        .tabs { display:flex; gap:0; border-bottom:2px solid #e2e8f0; margin:22px 0 0; }
        .tab-btn { padding:10px 18px; font-size:.82rem; font-weight:600; border:none; background:none; cursor:pointer; color:#64748b; border-bottom:2px solid transparent; margin-bottom:-2px; transition:.2s; display:flex; align-items:center; gap:6px; }
        .tab-btn.active { color:#2d5a8e; border-bottom-color:#2d5a8e; }
        .tab-btn:hover:not(.active) { color:#1e293b; background:#f8fafc; }

        /* ── Form Sections ── */
        .form-section { margin-top:18px; }
        .section-heading { font-size:.82rem; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:#64748b; margin:0 0 12px; }
        .field-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px; }
        .field-item { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; }
        .field-label { font-size:.73rem; color:#94a3b8; font-weight:500; display:block; margin-bottom:4px; text-transform:capitalize; }
        .field-value { font-size:.875rem; color:#1e293b; font-weight:600; word-break:break-word; }

        /* ── Geo Tag ── */
        .geo-card { background:#f0f7ff; border:1.5px solid #bfdbfe; border-radius:14px; padding:20px; }
        .geo-coords { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:14px 0; }
        .geo-coord-box { background:#fff; border-radius:10px; padding:14px; border:1px solid #e2e8f0; text-align:center; }
        .geo-coord-box span { display:block; font-size:.72rem; color:#64748b; margin-bottom:4px; }
        .geo-coord-box strong { font-size:1.1rem; font-weight:700; color:#1e3a5f; }
        .geo-link { display:inline-flex; align-items:center; gap:6px; background:#2d5a8e; color:#fff; text-decoration:none; border-radius:8px; padding:9px 16px; font-size:.82rem; font-weight:600; transition:.2s; }
        .geo-link:hover { background:#1e3a5f; }
        .no-geo { background:#fef9f0; border:1.5px dashed #fbbf24; border-radius:12px; padding:20px; text-align:center; color:#92400e; font-size:.875rem; }

        /* ── Photos ── */
        .photo-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; margin-top:14px; }
        .photo-item { border-radius:10px; overflow:hidden; border:1px solid #e2e8f0; cursor:pointer; transition:.2s; aspect-ratio:1; }
        .photo-item:hover { transform:scale(1.02); box-shadow:0 4px 14px rgba(0,0,0,.15); }
        .photo-item img { width:100%; height:100%; object-fit:cover; }
        .no-photo { background:#f8fafc; border:1.5px dashed #e2e8f0; border-radius:12px; padding:32px; text-align:center; color:#94a3b8; }

        /* ── Review Panel ── */
        .review-panel { background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%); border:1.5px solid #bae6fd; border-radius:14px; padding:20px; margin-top:22px; }
        .review-panel h4 { font-size:.95rem; font-weight:700; color:#0c4a6e; margin:0 0 14px; display:flex; align-items:center; gap:8px; }
        .decision-row { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:14px; }
        .decision-card { border:2px solid #e2e8f0; border-radius:10px; padding:12px; text-align:center; cursor:pointer; background:#fff; transition:.2s; font-size:.82rem; font-weight:600; color:#475569; }
        .decision-card:hover { border-color:#2d5a8e; color:#2d5a8e; }
        .decision-card.selected-APPROVED { border-color:#10b981; background:#ecfdf5; color:#065f46; }
        .decision-card.selected-REJECTED { border-color:#ef4444; background:#fef2f2; color:#7f1d1d; }
        .decision-card.selected-NEEDS_REVISION { border-color:#f59e0b; background:#fffbeb; color:#78350f; }
        .remarks-box { width:100%; border:1.5px solid #e2e8f0; border-radius:10px; padding:12px; font-size:.875rem; font-family:inherit; resize:vertical; min-height:80px; outline:none; transition:.2s; box-sizing:border-box; }
        .remarks-box:focus { border-color:#2d5a8e; }
        .submit-btn { display:flex; align-items:center; justify-content:center; gap:8px; background:#1e3a5f; color:#fff; border:none; border-radius:10px; padding:12px 24px; font-size:.9rem; font-weight:600; cursor:pointer; width:100%; margin-top:12px; transition:.2s; }
        .submit-btn:hover:not(:disabled) { background:#2d5a8e; }
        .submit-btn:disabled { opacity:.55; cursor:not-allowed; }

        /* ── Image Modal ── */
        .img-modal { position:fixed; inset:0; background:rgba(0,0,0,.88); z-index:200; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .img-modal img { max-width:90vw; max-height:90vh; border-radius:12px; box-shadow:0 24px 60px rgba(0,0,0,.5); }
        .img-modal-close { position:fixed; top:20px; right:24px; color:#fff; background:rgba(255,255,255,.15); border:none; border-radius:50%; width:40px; height:40px; cursor:pointer; font-size:1.2rem; display:flex; align-items:center; justify-content:center; }

        /* ── Toast ── */
        .toast { position:fixed; bottom:28px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:10px; color:#fff; border-radius:12px; padding:12px 22px; font-size:.875rem; font-weight:500; cursor:pointer; z-index:999; box-shadow:0 8px 32px rgba(0,0,0,.2); min-width:280px; max-width:480px; animation:slideUp .3s; }
        .toast-close { margin-left:auto; opacity:.75; }
        @keyframes slideUp { from{transform:translateX(-50%) translateY(20px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }

        /* ── Loading ── */
        .skeleton { background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
        @keyframes shimmer { 0%{background-position:200%} 100%{background-position:-200%} }
        .empty-state { text-align:center; padding:64px 32px; color:#94a3b8; }
        .empty-state svg { margin:0 auto 16px; display:block; }
        /* ── Dark Mode Overrides ── */
        .dark .vp-wrap { background: #0F172A; }
        .dark .vp-header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%); border-bottom: 1px solid #1e293b; }
        .dark .search-box, .dark .filter-btn, .dark .stat-card, .dark .table-card { background: #1E293B; border-color: #334155; }
        .dark .search-box input { color: #f1f5f9; }
        .dark .filter-btn { color: #94a3b8; }
        .dark .filter-btn.active, .dark .filter-btn:hover { background: #334155; color: #60A5FA; border-color: #60A5FA; }
        .dark .stat-card .stat-num { color: #f1f5f9; }
        .dark .stat-card .stat-lbl { color: #94a3b8; }
        .dark .table-header { background: #0F172A; border-color: #334155; color: #94a3b8; }
        .dark .table-row { border-color: #334155; }
        .dark .table-row:hover { background: #334155; }
        .dark .row-name { color: #f1f5f9; }
        .dark .row-sub { color: #64748b; }
        .dark .row-text { color: #cbd5e1; }
        .dark .icon-btn { border-color: #334155; color: #94a3b8; }
        .dark .icon-btn:hover { background: #334155; color: #60A5FA; border-color: #60A5FA; }
        .dark .detail-panel { background: #0F172A; }
        .dark .panel-head { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); }
        .dark .info-card, .dark .field-item, .dark .no-photo { background: #1E293B; border-color: #334155; }
        .dark .info-card h5, .dark .section-heading { color: #94a3b8; }
        .dark .info-row .label, .dark .field-label { color: #64748b; }
        .dark .info-row .value, .dark .field-value { color: #f1f5f9; }
        .dark .tabs { border-color: #334155; }
        .dark .tab-btn { color: #64748b; }
        .dark .tab-btn.active { color: #60A5FA; border-color: #60A5FA; }
        .dark .tab-btn:hover:not(.active) { color: #f1f5f9; background: #1E293B; }
        .dark .geo-card { background: #1E293B; border-color: #334155; }
        .dark .geo-coord-box { background: #0F172A; border-color: #334155; }
        .dark .geo-coord-box span { color: #64748b; }
        .dark .geo-coord-box strong { color: #f1f5f9; }
        .dark .geo-link { background: #3B82F6; }
        .dark .geo-link:hover { background: #2563EB; }
        .dark .photo-item { border-color: #334155; }
        .dark .review-panel { background: #1E293B; border-color: #334155; }
        .dark .review-panel h4 { color: #f1f5f9; }
        .dark .decision-card { background: #0F172A; border-color: #334155; color: #94a3b8; }
        .dark .decision-card:hover { border-color: #60A5FA; color: #60A5FA; }
        .dark .remarks-box { background: #0F172A; border-color: #334155; color: #f1f5f9; }
        .dark .empty-state { color: #64748b; }
      `}</style>

      <div className="vp-wrap">
        {/* Header */}
        <div className="vp-header">
          <h1>📋 Verification Review Center</h1>
          <p>Review agent-submitted documents — approve, reject, or request revision</p>
        </div>

        <div className="vp-body">
          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-num">{cases.length}</div>
              <div className="stat-lbl">Awaiting Review</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{cases.filter(c => c.type === "Residential").length}</div>
              <div className="stat-lbl">Residential Cases</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{cases.filter(c => c.type === "Business").length}</div>
              <div className="stat-lbl">Business Cases</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{cases.reduce((s, c) => s + c.mediaCount, 0)}</div>
              <div className="stat-lbl">Total Photos Submitted</div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-box">
              <FiSearch size={15} color="#94a3b8" />
              <input placeholder="Search customer, app ID, agent…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {["All", "Residential", "Business"].map(t => (
              <button key={t} className={`filter-btn${typeFilter === t ? " active" : ""}`} onClick={() => setTypeFilter(t)}>
                <FiFilter size={13} /> {t}
              </button>
            ))}
            <button className="refresh-btn" onClick={loadCases}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Table */}
          <div className="table-card">
            <div className="table-header">
              <span>Customer</span>
              <span>Application</span>
              <span>Type</span>
              <span>Agent</span>
              <span>Submitted At</span>
              <span>Loan Amount</span>
              <span>Actions</span>
            </div>

            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="table-row" style={{ cursor: "default" }}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <div key={j} className="skeleton" style={{ height: 20 }} />
                  ))}
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <FiCheckCircle size={48} />
                <p style={{ fontSize: "1rem", fontWeight: 600, color: "#475569", marginTop: 8 }}>No completed cases found</p>
                <p style={{ fontSize: ".875rem" }}>Agents haven't submitted any cases yet, or all have been reviewed.</p>
              </div>
            ) : filtered.map(c => (
              <div key={c.id} className="table-row" onClick={() => openCase(c.id)}>
                <div>
                  <div className="row-name">{c.customer}</div>
                  <div className="row-sub">{c.branch}</div>
                </div>
                <div className="row-text" style={{ fontSize: ".78rem", fontFamily: "monospace" }}>{c.applicationId}</div>
                <div>
                  <span className="badge" style={{ background: c.type === "Residential" ? "#dbeafe" : "#fde8d8", color: c.type === "Residential" ? "#1d4ed8" : "#c2410c" }}>
                    {c.type === "Residential" ? <FiHome size={10} /> : <FiBriefcase size={10} />} {c.type}
                  </span>
                </div>
                <div className="row-text">{c.agent}</div>
                <div className="row-text" style={{ fontSize: ".78rem" }}>
                  <FiClock size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />{c.submittedAt}
                </div>
                <div className="row-text" style={{ fontWeight: 600 }}>{formatCurrency(c.loanAmount)}</div>
                <div className="actions-cell" onClick={e => e.stopPropagation()}>
                  <button className="icon-btn" title="View Details" onClick={() => openCase(c.id)}><FiEye size={14} /></button>
                  <button className="icon-btn" title="Download" onClick={() => downloadReport(c)}><FiDownload size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Panel Overlay */}
      {(selectedCase || detailLoading) && (
        <>
          <div className="overlay" onClick={() => setSelectedCase(null)} />
          <div className="detail-panel">
            {/* Panel Header */}
            <div className="panel-head">
              <div>
                <h2>{detailLoading ? "Loading…" : selectedCase?.customer.name}</h2>
                <p>{detailLoading ? "" : `${selectedCase?.type} Verification · ${selectedCase?.customer.applicationId}`}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {selectedCase && (
                  <button className="close-btn" onClick={() => downloadReport(selectedCase)} title="Download Report">
                    <FiDownload size={15} />
                  </button>
                )}
                <button className="close-btn" onClick={() => setSelectedCase(null)}><FiX size={16} /></button>
              </div>
            </div>

            <div className="panel-body">
              {detailLoading ? (
                <div style={{ padding: "40px 0" }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 48, marginBottom: 14, borderRadius: 12 }} />
                  ))}
                </div>
              ) : selectedCase && (
                <>
                  {/* Info Cards */}
                  <div className="info-grid">
                    {/* Customer Info */}
                    <div className="info-card">
                      <h5><FiUser size={12} /> Customer Info</h5>
                      {[
                        ["Name", selectedCase.customer.name],
                        ["App ID", selectedCase.customer.applicationId],
                        ["Phone", selectedCase.customer.phone],
                        ["Email", selectedCase.customer.email],
                        ["Loan Type", selectedCase.customer.loanType],
                        ["Loan Amount", formatCurrency(selectedCase.customer.loanAmount)],
                      ].map(([l, v]) => v && (
                        <div key={l} className="info-row">
                          <span className="label">{l}</span>
                          <span className="value">{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Agent Info */}
                    <div className="info-card">
                      <h5><FiUser size={12} /> Agent Info</h5>
                      {[
                        ["Name", selectedCase.agent.name],
                        ["Email", selectedCase.agent.email],
                        ["Phone", selectedCase.agent.phone],
                        ["Branch", selectedCase.agent.branch],
                        ["Submitted", selectedCase.submittedAt],
                        ["Created", selectedCase.createdAt],
                      ].map(([l, v]) => v && (
                        <div key={l} className="info-row">
                          <span className="label">{l}</span>
                          <span className="value">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Remarks */}
                  {selectedCase.remarks && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 16, marginTop: 14 }}>
                      <p style={{ margin: 0, fontSize: ".82rem", color: "#78350f" }}>
                        <strong>Agent Remarks:</strong> {selectedCase.remarks}
                      </p>
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="tabs">
                    {[
                      { key: "geo", label: "Geo Tag", icon: <FiMapPin size={12} /> },
                      { key: "residential", label: "Residential Form", icon: <FiHome size={12} />, show: selectedCase.type === "Residential" || selectedCase.profileData?.residential },
                      { key: "business", label: "Business Form", icon: <FiBriefcase size={12} />, show: selectedCase.type === "Business" || selectedCase.profileData?.business },
                      { key: "photos", label: `Photos (${selectedCase.media.length})`, icon: <FiImage size={12} /> },
                    ].filter(t => t.show !== false).map(t => (
                      <button
                        key={t.key}
                        className={`tab-btn${activeTab === t.key ? " active" : ""}`}
                        onClick={() => setActiveTab(t.key as any)}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab: Geo Tag */}
                  {activeTab === "geo" && (
                    selectedCase.geoTag.hasLocation ? (
                      <div className="geo-card" style={{ marginTop: 18 }}>
                        <h4 style={{ margin: "0 0 4px", color: "#1e40af", fontSize: ".9rem", display: "flex", alignItems: "center", gap: 8 }}>
                          <FiMapPin /> GPS Location Captured
                        </h4>
                        <p style={{ margin: "0 0 14px", fontSize: ".8rem", color: "#3b82f6" }}>
                          Agent verified the site location on-ground
                        </p>
                        <div className="geo-coords">
                          <div className="geo-coord-box">
                            <span>Latitude</span>
                            <strong>{selectedCase.geoTag.latitude?.toFixed(6)}° N</strong>
                          </div>
                          <div className="geo-coord-box">
                            <span>Longitude</span>
                            <strong>{selectedCase.geoTag.longitude?.toFixed(6)}° E</strong>
                          </div>
                        </div>
                        <a
                          className="geo-link"
                          href={`https://www.google.com/maps?q=${selectedCase.geoTag.latitude},${selectedCase.geoTag.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FiMapPin size={14} /> Open in Google Maps
                        </a>
                      </div>
                    ) : (
                      <div className="no-geo" style={{ marginTop: 18 }}>
                        <FiAlertCircle size={24} style={{ marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                        No GPS data captured for this case.
                      </div>
                    )
                  )}

                  {/* Tab: Residential Form */}
                  {activeTab === "residential" && (
                    <div style={{ marginTop: 4 }}>
                      {selectedCase.profileData?.residential ? (
                        <FieldGrid data={selectedCase.profileData.residential} title="Residential Verification Form" />
                      ) : selectedCase.profileData && Object.keys(selectedCase.profileData).some(k => !["business", "adminReview"].includes(k)) ? (
                        <FieldGrid data={selectedCase.profileData} title="Verification Form Data" />
                      ) : (
                        <div className="no-photo" style={{ marginTop: 18 }}>
                          <FiFileText size={32} style={{ marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                          No residential form data available.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Business Form */}
                  {activeTab === "business" && (
                    <div style={{ marginTop: 4 }}>
                      {selectedCase.profileData?.business ? (
                        <FieldGrid data={selectedCase.profileData.business} title="Business Verification Form" />
                      ) : selectedCase.profileData && Object.keys(selectedCase.profileData).some(k => !["residential", "adminReview"].includes(k)) ? (
                        <FieldGrid data={selectedCase.profileData} title="Verification Form Data" />
                      ) : (
                        <div className="no-photo" style={{ marginTop: 18 }}>
                          <FiBriefcase size={32} style={{ marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                          No business form data available.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Photos */}
                  {activeTab === "photos" && (
                    selectedCase.media.length > 0 ? (
                      <div className="photo-grid">
                        {selectedCase.media.map(m => (
                          <div key={m.id} className="photo-item" onClick={() => setImageModal(m.url)} title={m.type}>
                            <img src={m.url} alt={m.type} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-photo" style={{ marginTop: 18 }}>
                        <FiImage size={32} style={{ marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                        No photos uploaded for this case.
                      </div>
                    )
                  )}

                  {/* Review Panel */}
                  <div className="review-panel">
                    <h4><FiStar size={16} /> Admin Review Decision</h4>
                    <div className="decision-row">
                      {decisionOptions.map(opt => (
                        <div
                          key={opt.value}
                          className={`decision-card${decision === opt.value ? ` selected-${opt.value}` : ""}`}
                          onClick={() => setDecision(opt.value as any)}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                    <textarea
                      className="remarks-box"
                      placeholder="Add review remarks (optional) — the agent will see this feedback…"
                      value={adminRemarks}
                      onChange={e => setAdminRemarks(e.target.value)}
                    />
                    <button
                      className="submit-btn"
                      onClick={submitReview}
                      disabled={!decision || submitting}
                    >
                      {submitting ? (
                        <><FiRefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> Submitting…</>
                      ) : (
                        <><FiSend size={15} /> Submit Decision &amp; Notify Agent</>
                      )}
                    </button>
                    {!decision && (
                      <p style={{ textAlign: "center", fontSize: ".78rem", color: "#94a3b8", marginTop: 6 }}>
                        Select a decision above to submit
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Image Lightbox */}
      {imageModal && (
        <div className="img-modal" onClick={() => setImageModal(null)}>
          <button className="img-modal-close" onClick={() => setImageModal(null)}><FiX /></button>
          <img src={imageModal} alt="Evidence" />
        </div>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </>
  );
}
