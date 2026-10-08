"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiBriefcase, FiCheckCircle, FiClock, FiAlertCircle, FiRefreshCw,
  FiMapPin, FiArrowRight, FiChevronRight, FiNavigation,
  FiCamera, FiPhone, FiUpload, FiMessageSquare, FiTrendingUp, FiCalendar, FiChevronDown, FiX, FiCheck,
  FiSearch, FiCopy, FiExternalLink, FiFileText, FiSend, FiPlus
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ScheduleRouteMap from "@/components/shared/ScheduleRouteMap";
import {
  startRideApi, endRideApi, logLocationPingApi, geocodeCasesApi,
  getAgentDashboardApi, getAgentCasesApi, updateAgentCaseRemarkApi, uploadEvidenceApi
} from "@/lib/api";
import { getProfileByCode } from "@/lib/verificationProfiles";

/* ─── Agent Dashboard ─────────────────────────────────────────────────────── */

export default function AgentDashboard() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Pending" | "In Progress" | "High Priority">("All");
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  });
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [liveCases, setLiveCases] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Agent location & coords
  const [agentCoords, setAgentCoords] = useState({ lat: 10.7905, lng: 78.7047 });
  const [gpsActive, setGpsActive] = useState(false);

  // Modals state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Remark Form State
  const [remarkText, setRemarkText] = useState("");
  const [remarkStatus, setRemarkStatus] = useState("IN_PROGRESS");
  const [savingRemark, setSavingRemark] = useState(false);

  // Photo / Doc Upload State
  const [photoTag, setPhotoTag] = useState("House Exterior & Gate");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [docType, setDocType] = useState("Aadhaar Card / ID Proof");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  // Tracking State
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [rideDuration, setRideDuration] = useState(0);

  // Ride Location Pinger & Timer
  useEffect(() => {
    if (!activeRideId) return;

    const timer = setInterval(() => {
      setRideDuration((prev) => prev + 1);
    }, 1000);

    let pingFailCount = 0;
    const pinger = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          try {
            await logLocationPingApi({
              rideId: activeRideId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              speed: pos.coords.speed || 0,
            });
            pingFailCount = 0;
          } catch (e) {
            pingFailCount++;
            if (pingFailCount >= 3) {
              toast.error("GPS tracking interrupted. Please check your connection.");
              pingFailCount = 0;
            }
          }
        });
      }
    }, 10000); // ping every 10s

    return () => {
      clearInterval(timer);
      clearInterval(pinger);
    };
  }, [activeRideId]);

  // BeforeUnload Warning
  useEffect(() => {
    if (!activeRideId) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Active Ride in Progress. Leaving this page will pause your tracking.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeRideId]);

  const handleStartRide = async () => {
    try {
      const res = await startRideApi();
      setActiveRideId(res.data.data.id);
      toast.success("Ride started! Tracking your live route.");
      if ("wakeLock" in navigator) {
        try {
          (window as any).wakeLockObj = await (navigator as any).wakeLock.request("screen");
        } catch (err) {}
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to start ride");
    }
  };

  const handleEndRide = async () => {
    if (!activeRideId) return;
    try {
      await endRideApi(activeRideId);
      setActiveRideId(null);
      setRideDuration(0);
      toast.success("Ride ended successfully.");
      if ((window as any).wakeLockObj) {
        (window as any).wakeLockObj.release();
        (window as any).wakeLockObj = null;
      }
    } catch (err: any) {
      toast.error("Failed to end ride");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setAgentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsActive(true);
        },
        (err) => {
          console.warn("Geolocation watch failed, using fallback:", err);
          navigator.geolocation.getCurrentPosition(
            (p) => {
              setAgentCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
              setGpsActive(true);
            },
            undefined,
            { timeout: 5000 }
          );
        },
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const [caseCoords, setCaseCoords] = useState<Record<string, { lat: number | null; lng: number | null }>>({});

  // Resolve schedule locations
  useEffect(() => {
    if (!dashboardData?.todaySchedule) return;

    const coords: Record<string, { lat: number | null; lng: number | null }> = {};
    const needGeocode: string[] = [];

    for (const s of dashboardData.todaySchedule) {
      if (s.addressLatitude != null && s.addressLongitude != null) {
        coords[s.id] = { lat: s.addressLatitude, lng: s.addressLongitude };
      } else if (s.address) {
        needGeocode.push(s.id);
      }
    }

    setCaseCoords(coords);
    if (!needGeocode.length) return;

    (async () => {
      try {
        const res = await geocodeCasesApi(needGeocode);
        const data = res.data?.data ?? {};
        setCaseCoords((prev) => {
          const next = { ...prev };
          Object.keys(data).forEach((id) => {
            const r = data[id];
            if (r && typeof r.lat === "number" && typeof r.lng === "number") {
              next[id] = { lat: r.lat, lng: r.lng };
            }
          });
          return next;
        });
      } catch (err) {
        console.warn("Failed to geocode schedule locations:", err);
      }
    })();
  }, [dashboardData]);

  const destinations = dashboardData?.todaySchedule?.map((s: any) => {
    const known = caseCoords[s.id];
    const lat = typeof s.addressLatitude === "number" ? s.addressLatitude : (known?.lat ?? null);
    const lng = typeof s.addressLongitude === "number" ? s.addressLongitude : (known?.lng ?? null);
    return {
      id: s.id,
      name: s.name,
      address: s.address || "No address provided",
      lat,
      lng,
    };
  }) || [];

  const loadDashboard = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      const [dashRes, casesRes] = await Promise.all([
        getAgentDashboardApi(),
        getAgentCasesApi(),
      ]);
      setDashboardData(dashRes.data.data);
      const cases = casesRes.data.data || [];
      setLiveCases(cases);
      
      // Auto-select first active case if none selected yet
      if (!selectedCaseId && cases.length > 0) {
        const activeFirst = cases.find((c: any) => ["ASSIGNED", "PENDING", "IN_PROGRESS"].includes(c.status)) || cases[0];
        setSelectedCaseId(activeFirst?.id || null);
      }
      if (isManualRefresh) toast.success("Dashboard refreshed with live data");
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      toast.error("Failed to refresh dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Currently active selected case
  const selectedCase = useMemo(() => {
    if (!liveCases || liveCases.length === 0) return null;
    return liveCases.find((c: any) => c.id === selectedCaseId) || liveCases[0] || null;
  }, [liveCases, selectedCaseId]);

  // Filter cases logic
  const filteredCases = useMemo(() => {
    let result = liveCases;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        (c.customer && c.customer.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.applicationId && c.applicationId.toLowerCase().includes(q))
      );
    }
    
    // KPI filter
    if (activeKpi) {
      if (activeKpi === "Assigned") {
        result = result.filter(c => c.status === "ASSIGNED" || c.status === "PENDING" || c.status === "IN_PROGRESS");
      } else if (activeKpi === "Re-verification") {
        result = result.filter(c => c.needsRevision);
      } else {
        result = result.filter(c => c.status === activeKpi.toUpperCase());
      }
    } else {
      if (selectedFilter === "Pending") {
        result = result.filter(c => c.status === "ASSIGNED" || c.status === "PENDING");
      } else if (selectedFilter === "In Progress") {
        result = result.filter(c => c.status === "IN_PROGRESS");
      } else if (selectedFilter === "High Priority") {
        result = result.filter(c => c.priority === "High" || c.status === "PENDING");
      }
    }

    return result.map(c => {
      const coords = caseCoords[c.id];
      let distance = "Location unknown";
      if (coords && typeof coords.lat === "number" && typeof coords.lng === "number") {
        const distanceVal = haversineDistance(agentCoords.lat, agentCoords.lng, coords.lat, coords.lng);
        distance = `${distanceVal.toFixed(1)} km away`;
      }

      return {
        ...c,
        distance,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      };
    });
  }, [liveCases, activeKpi, selectedFilter, searchQuery, caseCoords, agentCoords]);

  const handleKpiClick = (kpiName: string) => {
    if (activeKpi === kpiName) {
      setActiveKpi(null);
    } else {
      setActiveKpi(kpiName);
    }
  };

  // Quick Action Modal Triggers
  const openPhotoModal = () => {
    if (!selectedCase) {
      toast.error("Please select a case first.");
      return;
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowPhotoModal(true);
  };

  const openRemarkModal = () => {
    if (!selectedCase) {
      toast.error("Please select a case first.");
      return;
    }
    setRemarkText(selectedCase.remarks || "");
    setRemarkStatus(selectedCase.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS");
    setShowRemarkModal(true);
  };

  const openCallModal = () => {
    if (!selectedCase) {
      toast.error("Please select a case first.");
      return;
    }
    setShowCallModal(true);
  };

  const openUploadModal = () => {
    if (!selectedCase) {
      toast.error("Please select a case first.");
      return;
    }
    setDocFile(null);
    setShowUploadModal(true);
  };

  // Handlers for Quick Action Submissions
  const handleSaveRemark = async () => {
    if (!selectedCase) return;
    if (!remarkText.trim()) {
      toast.error("Please enter a remark or observation.");
      return;
    }
    setSavingRemark(true);
    try {
      await updateAgentCaseRemarkApi(selectedCase.id, {
        remarks: remarkText.trim(),
        status: remarkStatus,
      });
      toast.success(`Remark updated for ${selectedCase.customer}`);
      
      // Update locally
      setLiveCases(prev => prev.map(c => c.id === selectedCase.id ? { ...c, remarks: remarkText.trim(), status: remarkStatus } : c));
      setShowRemarkModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save remark");
    } finally {
      setSavingRemark(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedCase || !photoFile) {
      toast.error("Please select or capture a photo first.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", photoFile);
      formData.append("type", "PHOTO");
      formData.append("gpsLat", String(agentCoords.lat));
      formData.append("gpsLng", String(agentCoords.lng));
      formData.append("tag", photoTag);

      await uploadEvidenceApi(selectedCase.id, formData);
      toast.success(`Photo (${photoTag}) uploaded successfully for ${selectedCase.customer}!`);
      setShowPhotoModal(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      loadDashboard();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedCase || !docFile) {
      toast.error("Please select a document file to upload.");
      return;
    }
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", docFile);
      formData.append("type", "DOCUMENT");
      formData.append("tag", docType);

      await uploadEvidenceApi(selectedCase.id, formData);
      toast.success(`${docType} uploaded successfully for ${selectedCase.customer}!`);
      setShowUploadModal(false);
      setDocFile(null);
      loadDashboard();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const triggerNavigation = (address: string) => {
    if (!address) {
      toast.error("No address available for navigation.");
      return;
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, "_blank");
  };

  const triggerMultiRouteNavigation = () => {
    if (!destinations || destinations.length === 0) {
      toast.error("No active verifications scheduled to view route.");
      return;
    }
    const knownStops = destinations.filter(
      (d: any) => typeof d.lat === "number" && typeof d.lng === "number"
    );
    if (knownStops.length === 0) {
      toast.error("Locations are still being resolved. Try again in a moment.");
      return;
    }
    const coordToStr = (d: any) => `${d.lat},${d.lng}`;
    const startingPoint = coordToStr(knownStops[0]);
    const lastStop = knownStops[knownStops.length - 1];
    const destination = coordToStr(lastStop);
    const waypoints = knownStops
      .slice(0, -1)
      .map(coordToStr)
      .join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startingPoint)}&destination=${encodeURIComponent(destination)}`;
    if (waypoints) {
      url += `&waypoints=${encodeURIComponent(waypoints)}`;
    }

    toast.success(`Opening Google Maps route with ${knownStops.length} stops...`);
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 space-y-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Active Ride Overlay Banner ── */}
      {activeRideId && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md text-white flex flex-col items-center justify-center p-6">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6 border border-slate-700">
            <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center relative">
              <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
              <FiMapPin className="w-10 h-10 text-emerald-400" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-1 tracking-tight">Ride Active & Tracking</h2>
              <p className="text-slate-400 text-xs">Your live location is actively syncing with your branch admin.</p>
            </div>

            <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-inner">
              <div className="text-4xl font-mono tracking-widest text-emerald-400 font-bold">
                {Math.floor(rideDuration / 60).toString().padStart(2, '0')}:{ (rideDuration % 60).toString().padStart(2, '0') }
              </div>
              <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">Elapsed Ride Duration</div>
            </div>

            {/* Navigation Shortcuts */}
            <div className="space-y-2 text-left bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Assigned Stop</span>
              {selectedCase ? (
                <div className="pt-1.5 space-y-2.5">
                  <div className="text-xs">
                    <p className="font-bold text-slate-200">{selectedCase.customer}</p>
                    <p className="text-slate-400 truncate text-[11px] mt-0.5">{selectedCase.address}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => triggerNavigation(selectedCase.address)}
                      className="flex-1 h-9 bg-[#1E4DB7] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                    >
                      <FiNavigation className="w-3.5 h-3.5" />
                      <span>Directions</span>
                    </Button>
                    <Button
                      onClick={triggerMultiRouteNavigation}
                      disabled={destinations.length === 0}
                      className="flex-1 h-9 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                    >
                      <FiMapPin className="w-3.5 h-3.5" />
                      <span>Full Route</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 pt-1">No active stops assigned.</p>
              )}
            </div>

            <Button 
              onClick={handleEndRide}
              className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-base rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)]"
            >
              End Ride & Complete Tracking
            </Button>
          </div>
        </div>
      )}

    <div className="space-y-6 pb-12 text-slate-800" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            Welcome back, {dashboardData?.agent?.name || "Agent"}! 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Here's your live verification overview and schedule for today.</p>
        </div>
        
        {/* Date Selector & Manual Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
            title="Refresh live cases"
          >
            <FiRefreshCw className={cn("w-3.5 h-3.5 text-[#1E4DB7]", refreshing && "animate-spin")} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
            >
              <FiCalendar className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              <span>{currentDate}</span>
              <FiChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500" />
            </button>
            
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl shadow-lg z-50 py-1.5">
                {Array.from({ length: 4 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const str = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  return (
                    <button
                      key={str}
                      onClick={() => {
                        setCurrentDate(str);
                        setShowDatePicker(false);
                        toast.success(`Date changed to ${str}`);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors",
                        currentDate === str ? "text-[#1E4DB7] font-semibold" : "text-gray-600 dark:text-slate-400"
                      )}
                    >
                      {str}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* 1. Assigned Cases */}
        <button
          onClick={() => handleKpiClick("Assigned")}
          className={cn(
            "bg-white dark:bg-slate-950 rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md cursor-pointer",
            activeKpi === "Assigned" ? "border-[#1E4DB7] ring-2 ring-[#1E4DB7]/40 bg-blue-50/20" : "border-gray-100 dark:border-slate-800"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 mb-3">
            <FiBriefcase className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Assigned Cases</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 mt-1">{dashboardData?.kpis?.pending ?? liveCases.filter(c => c.status === "ASSIGNED" || c.status === "PENDING").length}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
            <FiTrendingUp className="w-3.5 h-3.5" />
            <span>Active assigned</span>
          </div>
        </button>

        {/* 2. In Progress */}
        <button
          onClick={() => handleKpiClick("In Progress")}
          className={cn(
            "bg-white dark:bg-slate-950 rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md cursor-pointer",
            activeKpi === "In Progress" ? "border-[#1E4DB7] ring-2 ring-[#1E4DB7]/40 bg-amber-50/20" : "border-gray-100 dark:border-slate-800"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 mb-3">
            <FiClock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">In Progress</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 mt-1">{dashboardData?.kpis?.inProgress ?? liveCases.filter(c => c.status === "IN_PROGRESS").length}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Under review</span>
          </div>
        </button>

        {/* 3. Completed */}
        <button
          onClick={() => handleKpiClick("Completed")}
          className={cn(
            "bg-white dark:bg-slate-950 rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md cursor-pointer",
            activeKpi === "Completed" ? "border-[#1E4DB7] ring-2 ring-[#1E4DB7]/40 bg-emerald-50/20" : "border-gray-100 dark:border-slate-800"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 mb-3">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Completed</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 mt-1">{dashboardData?.kpis?.completed ?? liveCases.filter(c => c.status === "COMPLETED" || c.status === "APPROVED").length}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
            <FiTrendingUp className="w-3.5 h-3.5" />
            <span>Total verified</span>
          </div>
        </button>

        {/* 4. Rejected */}
        <button
          onClick={() => handleKpiClick("Rejected")}
          className={cn(
            "bg-white dark:bg-slate-950 rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md cursor-pointer",
            activeKpi === "Rejected" ? "border-[#1E4DB7] ring-2 ring-[#1E4DB7]/40 bg-rose-50/20" : "border-gray-100 dark:border-slate-800"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600 mb-3">
            <FiAlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Rejected</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 mt-1">{dashboardData?.kpis?.rejected ?? liveCases.filter(c => c.status === "REJECTED").length}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-rose-600">
            <span>Declined/failed</span>
          </div>
        </button>

        {/* 5. Re-verification */}
        <button
          onClick={() => handleKpiClick("Re-verification")}
          className={cn(
            "bg-white dark:bg-slate-950 rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md cursor-pointer",
            activeKpi === "Re-verification" ? "border-[#1E4DB7] ring-2 ring-[#1E4DB7]/40 bg-orange-50/20" : "border-gray-100 dark:border-slate-800"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 mb-3">
            <FiRefreshCw className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Re-verification</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 mt-1">{dashboardData?.kpis?.reverification ?? liveCases.filter(c => c.needsRevision).length}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-orange-600">
            <span>Needs Revision</span>
          </div>
        </button>

        {/* 6. Avg Time */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 text-left border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 mb-3">
            <FiClock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Avg. Time</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 mt-1 truncate">{dashboardData?.kpis?.avgTime || '2h 15m'}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-gray-400 dark:text-slate-500">
            <span>Per verification</span>
          </div>
        </div>
      </div>

      {/* ── 3-Column Dashboard Body ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Column 1: Assigned Cases List with Selection */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-[16px] font-bold text-gray-900 dark:text-slate-100">Assigned Cases</h2>
                <p className="text-[11px] text-gray-400 dark:text-slate-500">Click any case to target Quick Actions & view details</p>
              </div>
              <Link href="/agent/cases" className="text-xs font-semibold text-[#1E4DB7] hover:underline">
                View all ({liveCases.length})
              </Link>
            </div>

            {/* Quick Search */}
            <div className="relative mb-3">
              <FiSearch className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customer, phone or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-2 scrollbar-none">
              {[
                { label: "All", count: liveCases.length },
                { label: "Pending", count: liveCases.filter(c => c.status === "ASSIGNED" || c.status === "PENDING").length },
                { label: "In Progress", count: liveCases.filter(c => c.status === "IN_PROGRESS").length },
                { label: "High Priority", count: liveCases.filter(c => c.priority === "High" || c.status === "PENDING").length }
              ].map((pill) => (
                <button
                  key={pill.label}
                  onClick={() => {
                    setSelectedFilter(pill.label as any);
                    setActiveKpi(null);
                  }}
                  className={cn(
                    "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer",
                    selectedFilter === pill.label && !activeKpi
                      ? "text-white bg-[#1E4DB7] border-[#1E4DB7] shadow-sm"
                      : "bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-100 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800"
                  )}
                >
                  {pill.label} ({pill.count})
                </button>
              ))}
            </div>

            {/* Case List with Selected Highlight */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredCases.length === 0 ? (
                <div className="text-center py-10 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-800 text-gray-400 dark:text-slate-500 text-xs">
                  No cases found under current filter
                </div>
              ) : (
                filteredCases.map((c) => {
                  const isSelected = selectedCase?.id === c.id;
                  const p = c.status === "PENDING" || c.status === "ASSIGNED" ? "High" : c.status === "IN_PROGRESS" ? "Medium" : "Low";
                  const profileName = getProfileByCode(c.type || 'RESIDENTIAL').name;
                  const displayId = c.applicationId || `APP-${c.id.slice(0, 8).toUpperCase()}`;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCaseId(c.id)}
                      className={cn(
                        "p-3.5 rounded-xl border transition-all cursor-pointer relative",
                        isSelected
                          ? "bg-blue-50/70 dark:bg-blue-950/30 border-[#1E4DB7] shadow-sm ring-1 ring-[#1E4DB7]/50"
                          : "border-gray-100 dark:border-slate-800 bg-[#FAFBFD] dark:bg-slate-900 hover:border-blue-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                              p === "High" ? "bg-rose-100 text-rose-700" :
                              p === "Medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                            )}>
                              {p}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                              {displayId}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-bold bg-[#1E4DB7] text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <FiCheck className="w-2.5 h-2.5" /> ACTIVE
                              </span>
                            )}
                          </div>
                          <h4 className="text-[14px] font-bold text-gray-900 dark:text-slate-100 leading-snug">{c.customer}</h4>
                          <p className="text-[12px] text-gray-500 dark:text-slate-400 truncate leading-snug">{c.address}</p>
                          <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 dark:text-slate-400">
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-[#1E4DB7] px-2 py-0.5 rounded-md font-semibold text-[10px]">
                              {profileName}
                            </span>
                            {c.phone && <span className="text-[10px] text-gray-400">📞 {c.phone}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                          <span className="text-[10px] text-[#1E4DB7] font-semibold flex items-center gap-1 bg-blue-50/80 px-2 py-0.5 rounded-full">
                            <FiMapPin className="w-3 h-3" />
                            {c.distance || "3.2 km"}
                          </span>
                          <FiChevronRight className={cn("w-4 h-4", isSelected ? "text-[#1E4DB7]" : "text-gray-300")} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 mt-4 text-center">
            <Link href="/agent/cases" className="text-xs font-bold text-[#1E4DB7] hover:underline flex items-center justify-center gap-1.5">
              <span>View full case directory</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Column 2: Today's Schedule & Live Route */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[16px] font-bold text-gray-900 dark:text-slate-100">Today's Schedule</h2>
                <p className="text-[11px] text-gray-400 dark:text-slate-500">Live planned stops & optimized transit route</p>
              </div>
              <button 
                onClick={triggerMultiRouteNavigation} 
                className="text-xs font-semibold text-[#1E4DB7] hover:underline disabled:text-gray-400 dark:text-slate-500 disabled:no-underline disabled:cursor-not-allowed flex items-center gap-1" 
                disabled={destinations.length === 0}
              >
                <FiNavigation className="w-3 h-3" />
                <span>View Route</span>
              </button>
            </div>

            {/* Route Map */}
            <div className="h-44 relative overflow-hidden mb-4 rounded-xl border border-gray-100 dark:border-slate-800">
              <ScheduleRouteMap agentLat={agentCoords.lat} agentLng={agentCoords.lng} destinations={destinations} />
            </div>

            {/* Schedule List */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {!dashboardData?.todaySchedule || dashboardData.todaySchedule.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-xs">
                  No active verifications scheduled for today.
                </div>
              ) : (
                dashboardData.todaySchedule.map((s: any) => {
                  const isSelected = selectedCase?.id === s.id;
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => setSelectedCaseId(s.id)}
                      className={cn(
                        "flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all cursor-pointer",
                        isSelected 
                          ? "bg-blue-50/70 dark:bg-blue-950/30 border-[#1E4DB7] ring-1 ring-[#1E4DB7]/40" 
                          : "bg-[#FAFBFD] dark:bg-slate-900 border-gray-50 dark:border-slate-800 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white shrink-0",
                          s.num === 1 ? "bg-rose-500" :
                          s.num === 2 ? "bg-amber-500" :
                          s.num === 3 ? "bg-blue-600" : "bg-slate-500"
                        )}>{s.num}</div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{s.name}</p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{s.type}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">{s.time}</p>
                        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5", s.bg || "bg-amber-50 text-amber-700")}>
                          {s.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={handleStartRide}
            disabled={loading || !!activeRideId}
            className="w-full mt-4 bg-[#1E4DB7] text-white hover:bg-blue-800 disabled:opacity-50 disabled:hover:bg-[#1E4DB7] py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer active:scale-98"
          >
            <FiMapPin className="w-4 h-4" />
            <span>{activeRideId ? "Live Ride in Progress" : "Start Live Ride Tracking"}</span>
          </button>
        </div>

        {/* Column 3: Current Case & Dynamic Quick Actions */}
        <div className="space-y-6">
          {/* Card 1: Target Active Case */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="text-[16px] font-bold text-gray-900 dark:text-slate-100">Target Case</h2>
              </div>
              {selectedCase && (
                <Link href={`/agent/cases/${selectedCase.id}`} className="text-xs font-semibold text-[#1E4DB7] hover:underline flex items-center gap-1">
                  <span>Full View</span>
                  <FiExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
            
            {selectedCase ? (
              <div className="space-y-2.5 bg-gray-50/60 dark:bg-slate-900/60 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[11px] font-mono font-bold text-[#1E4DB7] bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                    {selectedCase.applicationId || `APP-${selectedCase.id.slice(0, 8).toUpperCase()}`}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    selectedCase.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                    selectedCase.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {selectedCase.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-[16px] font-bold text-gray-900 dark:text-slate-100">{selectedCase.customer}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                    <span>{getProfileByCode(selectedCase.type || 'RESIDENTIAL').name}</span>
                    {selectedCase.phone && (
                      <a href={`tel:${selectedCase.phone}`} className="text-blue-600 hover:underline flex items-center gap-0.5">
                        <FiPhone className="w-3 h-3" /> {selectedCase.phone}
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-1.5 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800">
                  <FiMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 dark:text-slate-300 leading-snug line-clamp-2">{selectedCase.address}</p>
                </div>

                {selectedCase.remarks && (
                  <div className="text-[11px] bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 p-2 rounded-lg border border-amber-200/50">
                    <span className="font-bold">Latest Note: </span>{selectedCase.remarks}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 dark:text-slate-500 text-xs">
                No active cases assigned
              </div>
            )}

            {selectedCase && (
              <button
                onClick={() => router.push(`/agent/verify/${selectedCase.id}`)}
                className="w-full text-white py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer"
                style={{ background: "#1E4DB7" }}
              >
                <span>{['APPROVED', 'COMPLETED', 'REJECTED'].includes(selectedCase?.status) ? "Review Verification Evidence" : "Open Field Verification Workspace"}</span>
                <FiArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Card 2: Verification Progress Donut */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-slate-100">Verification Progress</h2>
              <Link href="/agent/cases" className="text-xs font-semibold text-[#1E4DB7] hover:underline">
                View all
              </Link>
            </div>

            {(() => {
              const total = liveCases.length || dashboardData?.kpis?.total || 0;
              const completed = liveCases.filter(c => c.status === "COMPLETED" || c.status === "APPROVED").length || dashboardData?.kpis?.completed || 0;
              const inProgress = liveCases.filter(c => c.status === "IN_PROGRESS").length || dashboardData?.kpis?.inProgress || 0;
              const pending = liveCases.filter(c => c.status === "PENDING" || c.status === "ASSIGNED").length || dashboardData?.kpis?.pending || 0;
              const rejected = liveCases.filter(c => c.status === "REJECTED").length || dashboardData?.kpis?.rejected || 0;
              const completedPercent = total === 0 ? 0 : Math.round((completed / total) * 100);
              return (
                <>
                  <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="38" className="text-gray-100 dark:text-slate-800" strokeWidth="6" stroke="currentColor" fill="transparent" />
                        <circle cx="48" cy="48" r="38" className="text-teal-500" strokeWidth="7" strokeDasharray={238} strokeDashoffset={238 - (238 * completedPercent) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-[16px] font-black text-gray-900 dark:text-slate-100">{completedPercent}%</span>
                        <p className="text-[9px] text-gray-400 dark:text-slate-500 font-semibold leading-tight">Completed</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 flex-1 text-xs font-semibold text-gray-600 dark:text-slate-400">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span>Completed</span>
                        </div>
                        <span className="text-gray-900 dark:text-slate-100 font-bold">{completed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          <span>In Progress</span>
                        </div>
                        <span className="text-gray-900 dark:text-slate-100 font-bold">{inProgress}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span>Pending</span>
                        </div>
                        <span className="text-gray-900 dark:text-slate-100 font-bold">{pending}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <span>Rejected</span>
                        </div>
                        <span className="text-gray-900 dark:text-slate-100 font-bold">{rejected}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-gray-100 dark:border-slate-800 pt-3 text-center">
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">Total Assigned</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-slate-100 mt-0.5">{total}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">Verified This Month</p>
                      <p className="text-sm font-bold text-emerald-600 mt-0.5">{completed}</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Card 3: Dynamic Quick Actions (Bound directly to Selected Case) */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-slate-100">Quick Actions</h2>
              {selectedCase && (
                <span className="text-[10px] font-semibold text-gray-400 truncate max-w-[120px]">
                  For: {selectedCase.customer.split(' ')[0]}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Capture Photo */}
              <button
                onClick={openPhotoModal}
                className="flex items-center gap-2.5 p-3 border border-gray-100 dark:border-slate-800 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-slate-900 transition-all text-left group active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-[#1E4DB7] shrink-0 group-hover:scale-105 transition-transform">
                  <FiCamera className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-gray-900 dark:text-slate-100 leading-tight">Capture Photo</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-tight mt-0.5">GPS Tagged</p>
                </div>
              </button>

              {/* 2. Add Remark */}
              <button
                onClick={openRemarkModal}
                className="flex items-center gap-2.5 p-3 border border-gray-100 dark:border-slate-800 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-slate-900 transition-all text-left group active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
                  <FiMessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-gray-900 dark:text-slate-100 leading-tight">Add Remark</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-tight mt-0.5">Field notes</p>
                </div>
              </button>

              {/* 3. Call Customer */}
              <button
                onClick={openCallModal}
                className="flex items-center gap-2.5 p-3 border border-gray-100 dark:border-slate-800 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-slate-900 transition-all text-left group active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
                  <FiPhone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-gray-900 dark:text-slate-100 leading-tight">Call Customer</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-tight mt-0.5">1-tap dial</p>
                </div>
              </button>

              {/* 4. Upload Document */}
              <button
                onClick={openUploadModal}
                className="flex items-center gap-2.5 p-3 border border-gray-100 dark:border-slate-800 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-slate-900 transition-all text-left group active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 shrink-0 group-hover:scale-105 transition-transform">
                  <FiUpload className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-gray-900 dark:text-slate-100 leading-tight">Upload Doc</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-tight mt-0.5">ID & proof</p>
                </div>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>

    {/* ══════════════════ MODALS ══════════════════ */}

    {/* ── 1. Photo Capture Modal ── */}
    {showPhotoModal && selectedCase && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E4DB7] flex items-center justify-center">
                <FiCamera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Capture Field Photo</h3>
                <p className="text-xs text-gray-500">Case: {selectedCase.customer}</p>
              </div>
            </div>
            <button onClick={() => setShowPhotoModal(false)} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Photo Category</label>
              <select
                value={photoTag}
                onChange={(e) => setPhotoTag(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500"
              >
                <option value="House Exterior & Gate">House Exterior & Gate</option>
                <option value="Customer with ID / Face">Customer with ID / Face</option>
                <option value="Electricity / Utility Meter">Electricity / Utility Meter</option>
                <option value="Street Nameplate & Landmark">Street Nameplate & Landmark</option>
                <option value="Business Signboard & Premises">Business Signboard & Premises</option>
                <option value="Stock / Inventory View">Stock / Inventory View</option>
              </select>
            </div>

            {/* Photo preview / upload trigger */}
            <div className="space-y-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-slate-900 aspect-video flex items-center justify-center">
                  <img src={photoPreview} alt="Captured preview" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] p-2 rounded-lg space-y-0.5">
                    <div className="flex justify-between font-mono">
                      <span>GPS: {agentCoords.lat.toFixed(4)}, {agentCoords.lng.toFixed(4)}</span>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                    <p className="truncate font-semibold text-emerald-400">{selectedCase.address}</p>
                  </div>
                  <button
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer transition-all space-y-2"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1E4DB7] flex items-center justify-center mx-auto">
                    <FiCamera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200">Tap to Take Photo or Choose File</p>
                    <p className="text-[11px] text-gray-400">Captures live timestamp & geolocation coordinates</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => router.push(`/agent/verify/${selectedCase.id}`)}
              className="flex-1 py-2.5 px-3 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-gray-50"
            >
              Full Workspace
            </button>
            <button
              onClick={handleUploadPhoto}
              disabled={!photoFile || uploadingPhoto}
              className="flex-1 py-2.5 px-3 bg-[#1E4DB7] hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
            >
              {uploadingPhoto ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiUpload className="w-3.5 h-3.5" />}
              <span>{uploadingPhoto ? "Uploading..." : "Save Evidence"}</span>
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── 2. Add Remark Modal ── */}
    {showRemarkModal && selectedCase && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FiMessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Add Field Remark</h3>
                <p className="text-xs text-gray-500">Case: {selectedCase.customer}</p>
              </div>
            </div>
            <button onClick={() => setShowRemarkModal(false)} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Quick Presets */}
            <div>
              <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 block mb-1.5">Quick Presets</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Customer Available & Met",
                  "Door Locked - Will Revisit",
                  "Met Family Member",
                  "Address Verified Successfully",
                  "Requested Evening Visit",
                  "Wrong Address Provided",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setRemarkText(chip)}
                    className="text-[10px] font-semibold bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-blue-400 px-2.5 py-1 rounded-full text-gray-700 dark:text-slate-300 transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Remark Notes</label>
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Enter detailed field observation notes..."
                rows={3}
                className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Update Case Status</label>
              <select
                value={remarkStatus}
                onChange={(e) => setRemarkStatus(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500"
              >
                <option value="IN_PROGRESS">IN_PROGRESS (Under Verification)</option>
                <option value="ASSIGNED">ASSIGNED (Pending Visit)</option>
                <option value="COMPLETED">COMPLETED (Verification Finished)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowRemarkModal(false)}
              className="flex-1 py-2.5 px-3 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRemark}
              disabled={savingRemark || !remarkText.trim()}
              className="flex-1 py-2.5 px-3 bg-[#1E4DB7] hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
            >
              {savingRemark ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
              <span>{savingRemark ? "Saving..." : "Save Remark"}</span>
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── 3. Call Customer Modal ── */}
    {showCallModal && selectedCase && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <FiPhone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Customer Contact</h3>
                <p className="text-xs text-gray-500">Direct dial customer</p>
              </div>
            </div>
            <button onClick={() => setShowCallModal(false)} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl text-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-[#1E4DB7] font-black text-xl flex items-center justify-center mx-auto">
              {selectedCase.customer.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900 dark:text-slate-100">{selectedCase.customer}</h4>
              <p className="text-xs text-gray-500">{getProfileByCode(selectedCase.type || 'RESIDENTIAL').name}</p>
            </div>
            <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-mono font-bold text-gray-800 dark:text-slate-200">
                {selectedCase.phone || "No phone provided"}
              </span>
              {selectedCase.phone && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedCase.phone);
                    toast.success("Phone number copied to clipboard!");
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Copy Phone"
                >
                  <FiCopy className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {selectedCase.phone ? (
              <a
                href={`tel:${selectedCase.phone}`}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                <FiPhone className="w-4 h-4" />
                <span>Call {selectedCase.phone}</span>
              </a>
            ) : (
              <button disabled className="w-full py-3 bg-gray-200 text-gray-400 rounded-xl text-sm font-bold">
                No Phone Number on File
              </button>
            )}

            {selectedCase.phone && (
              <a
                href={`https://wa.me/91${selectedCase.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(selectedCase.customer)},%20this%20is%20your%20Loan%20Verification%20Executive.`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 text-gray-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <FiSend className="w-3.5 h-3.5 text-emerald-600" />
                <span>Send WhatsApp Message</span>
              </a>
            )}
          </div>
        </div>
      </div>
    )}

    {/* ── 4. Upload Document Modal ── */}
    {showUploadModal && selectedCase && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <FiUpload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Upload Verification Document</h3>
                <p className="text-xs text-gray-500">Case: {selectedCase.customer}</p>
              </div>
            </div>
            <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500"
              >
                <option value="Aadhaar Card / ID Proof">Aadhaar Card / ID Proof</option>
                <option value="PAN Card Copy">PAN Card Copy</option>
                <option value="Electricity / Utility Bill">Electricity / Utility Bill</option>
                <option value="Salary Slip / Bank Statement">Salary Slip / Bank Statement</option>
                <option value="Property Tax Receipt / Deed">Property Tax Receipt / Deed</option>
                <option value="Rental Agreement / Lease">Rental Agreement / Lease</option>
                <option value="GST Certificate / Trade License">GST Certificate / Trade License</option>
              </select>
            </div>

            <div className="space-y-2">
              <input
                ref={docInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setDocFile(f);
                }}
                className="hidden"
              />
              
              {docFile ? (
                <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FiFileText className="w-6 h-6 text-purple-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{docFile.name}</p>
                      <p className="text-[10px] text-gray-500">{(docFile.size / 1024).toFixed(1)} KB • {docType}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDocFile(null)}
                    className="p-1 text-gray-400 hover:text-rose-600"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => docInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl p-6 text-center hover:border-purple-400 hover:bg-purple-50/20 cursor-pointer transition-all space-y-2"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                    <FiUpload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200">Tap to Choose Document</p>
                    <p className="text-[11px] text-gray-400">PDF, PNG, JPG accepted (Up to 10MB)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowUploadModal(false)}
              className="flex-1 py-2.5 px-3 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadDocument}
              disabled={!docFile || uploadingDoc}
              className="flex-1 py-2.5 px-3 bg-[#1E4DB7] hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
            >
              {uploadingDoc ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiUpload className="w-3.5 h-3.5" />}
              <span>{uploadingDoc ? "Uploading..." : "Upload Document"}</span>
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
