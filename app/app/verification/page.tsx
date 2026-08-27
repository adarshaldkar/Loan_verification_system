"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiDownload,
  FiMapPin,
  FiEye,
  FiFileText,
  FiHome,
  FiBriefcase,
  FiImage,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiChevronDown,
  FiX,
  FiSend,
  FiAlertCircle,
  FiClock,
  FiFilter,
  FiSearch,
  FiStar,
  FiLayers,
} from "react-icons/fi";
import {
  getCompletedCasesApi,
  getVerificationDetailApi,
  reviewCaseApi,
} from "@/lib/api";
import {
  VERIFICATION_PROFILES,
  getProfileByCode,
} from "@/lib/verificationProfiles";
import StructuredProfileReview from "@/components/verification/StructuredProfileReview";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface CaseSummary {
  id: string;
  customer: string;
  applicationId: string;
  type: string;
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
    name: string;
    applicationId: string;
    email: string;
    phone: string;
    address: string;
    loanAmount: number;
    loanType: string;
    businessName?: string;
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

const decisionOptions = [
  { value: "APPROVED", label: "✅ Approve", color: "#10b981" },
  { value: "REJECTED", label: "❌ Reject", color: "#ef4444" },
  { value: "NEEDS_REVISION", label: "🔄 Needs Revision", color: "#f59e0b" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
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
  const [activeTab, setActiveTab] = useState<"profile" | "geo" | "photos">("profile");

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

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  /* Filter */
  useEffect(() => {
    let list = [...cases];
    if (search) {
      list = list.filter(
        (c) =>
          c.customer.toLowerCase().includes(search.toLowerCase()) ||
          c.applicationId.toLowerCase().includes(search.toLowerCase()) ||
          c.agent.toLowerCase().includes(search.toLowerCase()) ||
          c.type.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (typeFilter !== "All") {
      list = list.filter((c) => {
        const conf = getProfileByCode(c.type);
        return c.type === typeFilter || conf.category === typeFilter || conf.code === typeFilter;
      });
    }
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
    setActiveTab("profile");
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
      showToast(res.data.message || "Review decision recorded", "success");
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
    const custName =
      "customer" in c && typeof c.customer === "object"
        ? c.customer.name
        : (c as CaseSummary).customer;
    const appId =
      "customer" in c && typeof c.customer === "object"
        ? c.customer.applicationId
        : (c as CaseSummary).applicationId;

    const content = `LVMS — Field Verification Report
=========================================
Application ID  : ${appId}
Customer Name   : ${custName}
Profile Type    : ${c.type} (${getProfileByCode(c.type).name})
Status          : ${c.status}
Submitted At    : ${c.submittedAt}
Report Date     : ${new Date().toLocaleString("en-IN")}
-----------------------------------------
Verified via LVMS Multi-Profile System.
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LVMS_${appId}_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        .vp-wrap { min-height:100vh; background:#f8fafc; font-family:'Inter',sans-serif; }
        .vp-header { background:linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 60%,#1a7ab5 100%); padding:32px 32px 28px; }
        .vp-header h1 { font-size:1.75rem; font-weight:700; color:#fff; margin:0 0 4px; }
        .vp-header p  { font-size:.9rem; color:rgba(255,255,255,.72); margin:0; }
        .vp-body  { padding:28px 32px; max-width:1400px; margin:0 auto; }

        .toolbar { display:flex; gap:12px; align-items:center; margin-bottom:24px; flex-wrap:wrap; }
        .search-box { display:flex; align-items:center; gap:8px; background:#fff; border:1.5px solid #e2e8f0; border-radius:10px; padding:8px 14px; flex:1; min-width:240px; }
        .search-box input { border:none; outline:none; font-size:.875rem; color:#334155; width:100%; background:transparent; }
        .filter-btn { display:flex; align-items:center; gap:6px; background:#fff; border:1.5px solid #e2e8f0; border-radius:10px; padding:8px 14px; font-size:.875rem; color:#475569; cursor:pointer; white-space:nowrap; transition:.2s; }
        .filter-btn.active,.filter-btn:hover { border-color:#2d5a8e; color:#2d5a8e; background:#eff6ff; }
        .refresh-btn { display:flex; align-items:center; gap:6px; background:#2d5a8e; color:#fff; border:none; border-radius:10px; padding:9px 18px; font-size:.875rem; cursor:pointer; transition:.2s; }
        .refresh-btn:hover { background:#1e3a5f; }

        .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
        .stat-card { background:#fff; border-radius:14px; padding:18px 22px; border:1px solid #e2e8f0; }
        .stat-card .stat-num { font-size:1.6rem; font-weight:700; color:#1e3a5f; }
        .stat-card .stat-lbl { font-size:.8rem; color:#64748b; margin-top:2px; }

        .table-card { background:#fff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; }
        .table-header { display:grid; grid-template-columns:2fr 1.2fr 1.2fr 1.3fr 1.3fr 1.1fr auto; gap:8px; padding:13px 20px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-size:.78rem; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
        .table-row { display:grid; grid-template-columns:2fr 1.2fr 1.2fr 1.3fr 1.3fr 1.1fr auto; gap:8px; padding:14px 20px; border-bottom:1px solid #f1f5f9; align-items:center; cursor:pointer; transition:.18s; }
        .table-row:hover { background:#f0f7ff; }
        .table-row:last-child { border-bottom:none; }
        .row-name { font-size:.875rem; font-weight:600; color:#1e293b; }
        .row-sub  { font-size:.75rem; color:#94a3b8; margin-top:1px; }
        .row-text { font-size:.82rem; color:#475569; }
        .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:.73rem; font-weight:600; }
        .actions-cell { display:flex; gap:6px; }
        .icon-btn { background:none; border:1px solid #e2e8f0; border-radius:8px; padding:6px; cursor:pointer; color:#64748b; transition:.15s; display:flex; align-items:center; }
        .icon-btn:hover { border-color:#2d5a8e; color:#2d5a8e; background:#eff6ff; }

        .overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:100; backdrop-filter:blur(3px); }
        .detail-panel { position:fixed; right:0; top:0; bottom:0; width:min(780px,97vw); background:#fff; z-index:101; display:flex; flex-direction:column; box-shadow:-8px 0 48px rgba(0,0,0,.15); overflow:hidden; }
        .panel-head { background:linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 100%); padding:22px 28px; display:flex; justify-content:space-between; align-items:flex-start; }
        .panel-head h2 { font-size:1.15rem; font-weight:700; color:#fff; margin:0 0 4px; }
        .panel-head p  { font-size:.82rem; color:rgba(255,255,255,.7); margin:0; }
        .close-btn { background:rgba(255,255,255,.15); border:none; border-radius:8px; color:#fff; padding:6px; cursor:pointer; display:flex; align-items:center; transition:.15s; }
        .close-btn:hover { background:rgba(255,255,255,.25); }

        .panel-body { padding:24px 28px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:20px; }
        .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .info-card { background:#f8fafc; border-radius:12px; padding:14px 16px; border:1px solid #e2e8f0; }
        .info-card h5 { font-size:.78rem; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:.05em; margin:0 0 10px; display:flex; align-items:center; gap:6px; }
        .info-row { display:flex; justify-content:space-between; font-size:.82rem; margin-bottom:6px; }
        .info-row:last-child { margin-bottom:0; }
        .info-row span:first-child { color:#64748b; }
        .info-row span:last-child  { font-weight:600; color:#1e293b; text-align:right; max-width:60%; }

        .tabs { display:flex; gap:8px; border-bottom:2px solid #e2e8f0; padding-bottom:0; margin-top:4px; }
        .tab-btn { background:none; border:none; padding:8px 14px; font-size:.85rem; font-weight:600; color:#64748b; cursor:pointer; position:relative; display:flex; align-items:center; gap:6px; transition:.2s; }
        .tab-btn.active { color:#2d5a8e; }
        .tab-btn.active::after { content:''; position:absolute; bottom:-2px; left:0; right:0; height:2px; background:#2d5a8e; border-radius:2px; }

        .geo-card { background:#eff6ff; border-radius:12px; padding:16px 20px; border:1px solid #bfdbfe; }
        .geo-coords { display:flex; gap:16px; margin:10px 0 14px; }
        .geo-coord-box { background:#fff; border-radius:8px; padding:8px 14px; flex:1; border:1px solid #dbeafe; }
        .geo-coord-box span { font-size:.72rem; color:#64748b; display:block; }
        .geo-coord-box strong { font-size:.9rem; color:#1e40af; }
        .geo-link { display:inline-flex; align-items:center; gap:6px; font-size:.82rem; color:#2563eb; font-weight:600; text-decoration:none; }
        .geo-link:hover { text-decoration:underline; }

        .photo-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; margin-top:14px; }
        .photo-item { border-radius:10px; overflow:hidden; border:1px solid #e2e8f0; aspect-ratio:4/3; background:#000; cursor:pointer; position:relative; }
        .photo-item img { width:100%; height:100%; object-fit:cover; transition:.2s; }
        .photo-item:hover img { transform:scale(1.04); }

        .review-panel { background:#faf5ff; border-radius:14px; padding:18px 20px; border:1.5px solid #e9d5ff; }
        .review-panel h4 { font-size:.875rem; font-weight:700; color:#6b21a8; margin:0 0 14px; display:flex; align-items:center; gap:6px; }
        .decision-row { display:flex; gap:10px; margin-bottom:14px; }
        .decision-btn { flex:1; padding:10px; border-radius:10px; border:2px solid #e2e8f0; background:#fff; font-size:.85rem; font-weight:600; cursor:pointer; transition:.18s; }
        .remarks-box { width:100%; border:1.5px solid #e2e8f0; border-radius:10px; padding:10px 14px; font-size:.85rem; resize:vertical; min-height:72px; outline:none; font-family:inherit; box-sizing:border-box; }
        .remarks-box:focus { border-color:#7c3aed; }
        .submit-review-btn { margin-top:10px; width:100%; padding:11px; background:#7c3aed; color:#fff; border:none; border-radius:10px; font-size:.9rem; font-weight:700; cursor:pointer; transition:.2s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .submit-review-btn:hover:not(:disabled) { background:#6d28d9; }
        .submit-review-btn:disabled { opacity:.5; cursor:not-allowed; }

        .toast { position:fixed; bottom:24px; right:24px; z-index:200; padding:14px 20px; border-radius:12px; color:#fff; font-size:.875rem; font-weight:600; display:flex; align-items:center; gap:10px; box-shadow:0 8px 30px rgba(0,0,0,.2); cursor:pointer; }
        .lightbox { position:fixed; inset:0; background:rgba(0,0,0,.88); z-index:300; display:flex; align-items:center; justify-content:center; padding:20px; }
        .lightbox img { max-width:92vw; max-height:88vh; border-radius:12px; box-shadow:0 8px 48px rgba(0,0,0,.6); }
      `}</style>

      <div className="vp-wrap">
        {/* Header */}
        <div className="vp-header">
          <h1>Verification Queue & Review</h1>
          <p>
            Review submitted questionnaires across all 12 custom verification profiles, check geo-locations, and grant decisions.
          </p>
        </div>

        <div className="vp-body">
          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-num">{cases.length}</div>
              <div className="stat-lbl">Completed Cases</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">
                {cases.filter((c) => c.status === "APPROVED").length}
              </div>
              <div className="stat-lbl">Approved</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">
                {cases.filter((c) => c.status === "COMPLETED" || c.status === "SUBMITTED").length}
              </div>
              <div className="stat-lbl">Pending Review</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">
                {cases.filter((c) => c.status === "REJECTED").length}
              </div>
              <div className="stat-lbl">Rejected / Revision</div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-box">
              <FiSearch color="#94a3b8" />
              <input
                placeholder="Search customer, application ID, agent, or profile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {["All", "Residential", "Business", "DSA", "Property"].map((t) => (
              <button
                key={t}
                className={`filter-btn${typeFilter === t ? " active" : ""}`}
                onClick={() => setTypeFilter(t)}
              >
                <FiFilter size={13} /> {t}
              </button>
            ))}

            <button className="refresh-btn" onClick={loadCases}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Cases Table */}
          <div className="table-card">
            <div className="table-header">
              <span>Customer</span>
              <span>Application</span>
              <span>Profile Type</span>
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
              <div className="p-12 text-center text-slate-400 text-xs">
                <FiCheckCircle size={40} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-semibold text-slate-700 text-sm">No cases found matching filters</p>
                <p className="text-slate-400 mt-1">Submitted cases from field agents will appear here for review.</p>
              </div>
            ) : (
              filtered.map((c) => {
                const prof = getProfileByCode(c.type);
                return (
                  <div key={c.id} className="table-row" onClick={() => openCase(c.id)}>
                    <div>
                      <div className="row-name">{c.customer}</div>
                      <div className="row-sub">{c.branch}</div>
                    </div>
                    <div className="row-text font-mono text-xs">{c.applicationId}</div>
                    <div>
                      <span className={`badge ${prof.badgeColor}`}>
                        {prof.name}
                      </span>
                    </div>
                    <div className="row-text">{c.agent}</div>
                    <div className="row-text text-xs">
                      <FiClock size={11} className="inline mr-1 text-slate-400" />
                      {c.submittedAt}
                    </div>
                    <div className="row-text font-bold text-slate-800">
                      {formatCurrency(c.loanAmount)}
                    </div>
                    <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="icon-btn"
                        title="View & Review Details"
                        onClick={() => openCase(c.id)}
                      >
                        <FiEye size={14} />
                      </button>
                      <button
                        className="icon-btn"
                        title="Download Report"
                        onClick={() => downloadReport(c)}
                      >
                        <FiDownload size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Detail Panel Drawer */}
      {(selectedCase || detailLoading) && (
        <>
          <div className="overlay" onClick={() => setSelectedCase(null)} />
          <div className="detail-panel">
            {/* Panel Head */}
            <div className="panel-head">
              <div>
                <h2>{detailLoading ? "Loading Case Details…" : selectedCase?.customer.name}</h2>
                <p>
                  {detailLoading
                    ? ""
                    : `${getProfileByCode(selectedCase?.type || "").name} · ${selectedCase?.customer.applicationId}`}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {selectedCase && (
                  <button
                    className="close-btn"
                    onClick={() => downloadReport(selectedCase)}
                    title="Download Report"
                  >
                    <FiDownload size={15} />
                  </button>
                )}
                <button className="close-btn" onClick={() => setSelectedCase(null)}>
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {/* Panel Body */}
            <div className="panel-body">
              {detailLoading ? (
                <div style={{ padding: "40px 0" }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="skeleton"
                      style={{ height: 48, marginBottom: 14, borderRadius: 12 }}
                    />
                  ))}
                </div>
              ) : (
                selectedCase && (
                  <>
                    {/* Basic Info Cards */}
                    <div className="info-grid">
                      <div className="info-card">
                        <h5>
                          <FiUser size={12} /> Customer Info
                        </h5>
                        <div className="info-row">
                          <span>Name</span>
                          <span>{selectedCase.customer.name}</span>
                        </div>
                        <div className="info-row">
                          <span>Phone</span>
                          <span>{selectedCase.customer.phone}</span>
                        </div>
                        <div className="info-row">
                          <span>Address</span>
                          <span>{selectedCase.customer.address}</span>
                        </div>
                        <div className="info-row">
                          <span>Loan Amount</span>
                          <span>{formatCurrency(selectedCase.customer.loanAmount)}</span>
                        </div>
                      </div>

                      <div className="info-card">
                        <h5>
                          <FiBriefcase size={12} /> Verification Info
                        </h5>
                        <div className="info-row">
                          <span>Profile Type</span>
                          <span className="font-bold text-blue-700">
                            {getProfileByCode(selectedCase.type).name}
                          </span>
                        </div>
                        <div className="info-row">
                          <span>Field Agent</span>
                          <span>{selectedCase.agent.name}</span>
                        </div>
                        <div className="info-row">
                          <span>Branch</span>
                          <span>{selectedCase.branch}</span>
                        </div>
                        <div className="info-row">
                          <span>Submitted At</span>
                          <span>{selectedCase.submittedAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="tabs">
                      <button
                        className={`tab-btn${activeTab === "profile" ? " active" : ""}`}
                        onClick={() => setActiveTab("profile")}
                      >
                        <FiFileText size={13} /> Questionnaire Responses
                      </button>
                      <button
                        className={`tab-btn${activeTab === "geo" ? " active" : ""}`}
                        onClick={() => setActiveTab("geo")}
                      >
                        <FiMapPin size={13} /> Geo Location
                      </button>
                      <button
                        className={`tab-btn${activeTab === "photos" ? " active" : ""}`}
                        onClick={() => setActiveTab("photos")}
                      >
                        <FiImage size={13} /> Evidence Photos ({selectedCase.media?.length || 0})
                      </button>
                    </div>

                    {/* Tab 1: Profile Responses */}
                    {activeTab === "profile" && (
                      <StructuredProfileReview
                        profileType={selectedCase.type}
                        profileData={selectedCase.profileData}
                      />
                    )}

                    {/* Tab 2: Geo Location */}
                    {activeTab === "geo" && (
                      <div>
                        {selectedCase.geoTag.hasLocation ? (
                          <div className="geo-card">
                            <h4
                              style={{
                                margin: "0 0 4px",
                                color: "#1e40af",
                                fontSize: ".9rem",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <FiMapPin /> GPS Location Captured
                            </h4>
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
                          <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                            No GPS coordinates captured for this case.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Photos */}
                    {activeTab === "photos" && (
                      <div>
                        {selectedCase.media && selectedCase.media.length > 0 ? (
                          <div className="photo-grid">
                            {selectedCase.media.map((m) => (
                              <div
                                key={m.id}
                                className="photo-item"
                                onClick={() => setImageModal(m.url)}
                                title={m.type}
                              >
                                <img src={m.url} alt={m.type} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                            No photos uploaded for this case.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Admin Decision Review Panel */}
                    <div className="review-panel">
                      <h4>
                        <FiStar size={16} /> Admin Review Decision
                      </h4>
                      <div className="decision-row">
                        {decisionOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className="decision-btn"
                            style={{
                              borderColor: decision === opt.value ? opt.color : "#e2e8f0",
                              background: decision === opt.value ? `${opt.color}15` : "#fff",
                              color: decision === opt.value ? opt.color : "#475569",
                            }}
                            onClick={() => setDecision(opt.value as any)}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <textarea
                        className="remarks-box"
                        placeholder="Add review remarks / reasons for approval or revision..."
                        value={adminRemarks}
                        onChange={(e) => setAdminRemarks(e.target.value)}
                      />

                      <button
                        className="submit-review-btn"
                        disabled={!decision || submitting}
                        onClick={submitReview}
                      >
                        {submitting ? (
                          "Submitting Decision..."
                        ) : (
                          <>
                            <FiSend size={15} /> Confirm & Save Decision
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className="toast"
          style={{
            background:
              toast.type === "success"
                ? "#10b981"
                : toast.type === "error"
                ? "#ef4444"
                : "#3b82f6",
          }}
          onClick={() => setToast(null)}
        >
          {toast.type === "success" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{toast.msg}</span>
          <FiX size={16} />
        </div>
      )}

      {/* Image Lightbox */}
      {imageModal && (
        <div className="lightbox" onClick={() => setImageModal(null)}>
          <img src={imageModal} alt="Enlarged verification evidence" />
        </div>
      )}
    </>
  );
}
