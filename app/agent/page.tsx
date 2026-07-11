"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiBriefcase, FiCheckCircle, FiClock, FiAlertCircle, FiRefreshCw,
  FiMapPin, FiArrowRight, FiBell, FiChevronRight, FiNavigation,
  FiCamera, FiPhone, FiUpload, FiMessageSquare, FiTrendingUp, FiCalendar, FiChevronDown, FiX, FiCheck
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ScheduleRouteMap from "@/components/shared/ScheduleRouteMap";
import { startRideApi, endRideApi, logLocationPingApi } from "@/lib/api";

/* ─── Mock Data ──────────────────────────────────────────────────────────── */

type CaseStatus = "Pending" | "In Progress" | "Completed" | "Rejected";
type Priority = "High" | "Medium" | "Low";

interface CaseItem {
  id: string;
  customer: string;
  type: string;
  address: string;
  priority: Priority;
  distance: string;
  status: CaseStatus;
  time?: string;
  order: number;
}

const initialCases: CaseItem[] = [
  { order: 1, id: "CASE-2026-0891", customer: "Ramesh Kumar", type: "Residential Verification", address: "123, 4th Cross Street, Anna Nagar, Trichy - 620018", priority: "High", distance: "2.3 km away", status: "Pending", time: "10:30 AM" },
  { order: 2, id: "CASE-2026-0892", customer: "Lakshmi Devi", type: "Business Verification", address: "56, Bharathi Nagar, Woraiyur, Trichy - 620003", priority: "Medium", distance: "5.6 km away", status: "Pending", time: "12:00 PM" },
  { order: 3, id: "CASE-2026-0893", customer: "Vijay Enterprises", type: "Business Verification", address: "18, Lawspet Road, Lawspet, Pondicherry - 605008", priority: "Medium", distance: "8.1 km away", status: "In Progress", time: "02:30 PM" },
  { order: 4, id: "CASE-2026-0894", customer: "Suresh Babu", type: "Residential Verification", address: "9, East Street, Srirangam, Trichy - 620006", priority: "Low", distance: "12.4 km away", status: "Pending", time: "04:30 PM" },
  { order: 5, id: "CASE-2026-0895", customer: "Karthik Traders", type: "Business Verification", address: "77, Main Road, Thanjavur - 613001", priority: "Low", distance: "18.7 km away", status: "Pending", time: "05:00 PM" },
  { order: 6, id: "CASE-2026-0888", customer: "Anjali Rao", type: "Residential Verification", address: "14, Vasanth Nagar, Bangalore", priority: "High", distance: "4.2 km away", status: "Completed", time: "09:00 AM" },
  { order: 7, id: "CASE-2026-0889", customer: "Vikram Malhotra", type: "Business Verification", address: "404, Prestige Towers, Bangalore", priority: "Medium", distance: "6.0 km away", status: "Completed", time: "10:00 AM" },
  { order: 8, id: "CASE-2026-0890", customer: "Sunil Dutt", type: "Residential Verification", address: "12, Outer Ring Road, Bangalore", priority: "Low", distance: "11.1 km away", status: "Rejected", time: "11:30 AM" }
];

export default function AgentDashboard() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Pending" | "In Progress" | "High Priority">("All");
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  });
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [liveCases, setLiveCases] = useState<any[]>([]);
  const [agentCoords, setAgentCoords] = useState({ lat: 10.7905, lng: 78.7047 });
  const [gpsActive, setGpsActive] = useState(false);

  // Tracking State
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [rideDuration, setRideDuration] = useState(0);

  // Ride Location Pinger & Timer
  useEffect(() => {
    if (!activeRideId) return;

    const timer = setInterval(() => {
      setRideDuration((prev) => prev + 1);
    }, 1000);

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
          } catch (e) {}
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
      toast.success("Ride started! Screen is locked.");
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
          // Try to get current position once as fallback
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

  const [caseCoords, setCaseCoords] = useState<Record<string, { lat: number; lng: number }>>({});

  useEffect(() => {
    if (!dashboardData?.todaySchedule) return;
    
    async function geocodeSchedules() {
      const coords: Record<string, { lat: number; lng: number }> = {};
      
      for (const s of dashboardData.todaySchedule) {
        if (!s.address) continue;
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(s.address)}&limit=1`;
          const res = await fetch(url);
          const data = await res.json();
          if (data && data.length > 0) {
            coords[s.id] = {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            };
          } else {
            // Fallback: Deterministic offset
            let hash = 0;
            const str = s.name || s.address || "";
            for (let i = 0; i < str.length; i++) {
              hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            const latOffset = ((Math.abs(hash) % 100) / 4000) - 0.0125;
            const lngOffset = (((Math.abs(hash) >> 8) % 100) / 4000) - 0.0125;
            coords[s.id] = {
              lat: agentCoords.lat + latOffset,
              lng: agentCoords.lng + lngOffset
            };
          }
        } catch (e) {
          // Fallback on network error/CORS
          let hash = 0;
          const str = s.name || s.address || "";
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          const latOffset = ((Math.abs(hash) % 100) / 4000) - 0.0125;
          const lngOffset = (((Math.abs(hash) >> 8) % 100) / 4000) - 0.0125;
          coords[s.id] = {
            lat: agentCoords.lat + latOffset,
            lng: agentCoords.lng + lngOffset
          };
        }
      }
      setCaseCoords(coords);
    }
    
    geocodeSchedules();
  }, [dashboardData, agentCoords.lat, agentCoords.lng]);

  const destinations = dashboardData?.todaySchedule?.map((s: any, idx: number) => {
    const coords = caseCoords[s.id] || {
      lat: agentCoords.lat,
      lng: agentCoords.lng
    };
    return {
      id: s.id,
      name: s.name,
      address: s.address || "No address provided",
      lat: coords.lat,
      lng: coords.lng,
    };
  }) || [];

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { getAgentDashboardApi, getAgentCasesApi } = await import("@/lib/api");
        const [dashRes, casesRes] = await Promise.all([
          getAgentDashboardApi(),
          getAgentCasesApi(),
        ]);
        setDashboardData(dashRes.data.data);
        setLiveCases(casesRes.data.data || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Agent Profile Header Skeleton */}
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

        {/* KPIs Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center p-3 border border-gray-50 rounded-xl space-y-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Cases Section Skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full ml-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter cases logic
  const getFilteredCases = () => {
    let result = liveCases;
    
    // If active KPI is clicked, filter by that status
    if (activeKpi) {
      if (activeKpi === "Assigned") {
        result = result.filter(c => c.status === "ASSIGNED" || c.status === "PENDING" || c.status === "IN_PROGRESS");
      } else {
        result = result.filter(c => c.status === activeKpi.toUpperCase());
      }
    } else {
      if (selectedFilter === "Pending") {
        result = result.filter(c => c.status === "ASSIGNED" || c.status === "PENDING");
      } else if (selectedFilter === "In Progress") {
        result = result.filter(c => c.status === "IN_PROGRESS");
      } else if (selectedFilter === "High Priority") {
        result = result.filter(c => c.status === "PENDING");
      }
    }

    return result.map(c => {
      const coords = caseCoords[c.id] || (() => {
        let hash = 0;
        const str = c.customer || c.address || "";
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const latOffset = ((Math.abs(hash) % 100) / 4000) - 0.0125;
        const lngOffset = (((Math.abs(hash) >> 8) % 100) / 4000) - 0.0125;
        return {
          lat: agentCoords.lat + latOffset,
          lng: agentCoords.lng + lngOffset
        };
      })();
      
      const distanceVal = haversineDistance(agentCoords.lat, agentCoords.lng, coords.lat, coords.lng);
      return {
        ...c,
        distance: `${distanceVal.toFixed(1)} km away`,
        lat: coords.lat,
        lng: coords.lng,
      };
    });
  };

  const handleKpiClick = (kpiName: string) => {
    if (activeKpi === kpiName) {
      setActiveKpi(null); // toggle off
    } else {
      setActiveKpi(kpiName);
    }
  };

  // Quick Action Handlers
  const triggerCamera = () => {
    const currentCase = liveCases[0];
    if (!currentCase) {
      toast.error("No active case assigned to capture photo for.");
      return;
    }
    toast.success(`Opening Camera for ${currentCase.customer}...`);
    router.push(`/agent/verify/${currentCase.id}`);
  };

  const triggerCall = () => {
    const currentCase = liveCases[0];
    if (!currentCase || !currentCase.phone) {
      toast.error("No active case with a valid phone number found.");
      return;
    }
    toast.success(`Calling ${currentCase.customer} at ${currentCase.phone}...`);
    window.location.href = `tel:${currentCase.phone}`;
  };

  const triggerUpload = () => {
    const currentCase = liveCases[0];
    if (!currentCase) {
      toast.error("No active case assigned to upload document for.");
      return;
    }
    toast.success(`Directing to upload documents for ${currentCase.customer}...`);
    router.push(`/agent/verify/${currentCase.id}`);
  };

  const triggerAddRemark = () => {
    const currentCase = liveCases[0];
    if (!currentCase) {
      toast.error("No active case assigned to add remark to.");
      return;
    }
    router.push(`/agent/verify/${currentCase.id}`);
  };

  const triggerNavigation = () => {
    const currentCase = liveCases[0];
    if (!currentCase) {
      toast.error("No active case assigned to start navigation for.");
      return;
    }
    toast.success(`Opening Google Maps direction for ${currentCase.customer}...`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentCase.address)}`, "_blank");
  };

  const triggerMultiRouteNavigation = () => {
    if (!destinations || destinations.length === 0) {
      toast.error("No active verifications scheduled to view route.");
      return;
    }
    // Starting coordinates
    const origin = `${agentCoords.lat},${agentCoords.lng}`;
    // Last stop coordinates
    const lastStop = destinations[destinations.length - 1];
    const destination = `${lastStop.lat},${lastStop.lng}`;
    // Intermediate stops
    const waypoints = destinations
      .slice(0, -1)
      .map((d: any) => `${d.lat},${d.lng}`)
      .join('|');
      
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    if (waypoints) {
      url += `&waypoints=${encodeURIComponent(waypoints)}`;
    }
    
    toast.success(`Opening Google Maps route with ${destinations.length} stops...`);
    window.open(url, "_blank");
  };

  return (
    <>
      {activeRideId && (
        <div className="fixed inset-0 z-[9999] bg-slate-900 text-white flex flex-col items-center justify-center p-6">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6">
            <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center relative">
              <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
              <FiMapPin className="w-10 h-10 text-emerald-400" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-2 tracking-tight">Ride Active</h2>
              <p className="text-slate-400 text-sm">Your location is being shared securely with your branch admin.</p>
            </div>

            <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 shadow-inner">
              <div className="text-5xl font-mono tracking-widest text-emerald-400 font-medium">
                {Math.floor(rideDuration / 60).toString().padStart(2, '0')}:{ (rideDuration % 60).toString().padStart(2, '0') }
              </div>
              <div className="text-xs text-slate-500 mt-2 uppercase tracking-widest font-semibold">Elapsed Time</div>
            </div>

            {/* Navigation Shortcuts */}
            <div className="space-y-2 text-left bg-slate-900/40 p-4 rounded-xl border border-slate-700/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Navigation Shortcuts</span>
              {liveCases[0] ? (
                <div className="pt-2 space-y-3">
                  <div className="text-xs">
                    <p className="font-bold text-slate-200">Next Case: {liveCases[0].customer}</p>
                    <p className="text-slate-400 truncate mt-0.5">{liveCases[0].address}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={triggerNavigation}
                      className="flex-1 h-10 bg-[#1E4DB7] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                    >
                      <FiNavigation className="w-3.5 h-3.5" />
                      <span>Next Stop</span>
                    </Button>
                    <Button
                      onClick={triggerMultiRouteNavigation}
                      disabled={destinations.length === 0}
                      className="flex-1 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
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

            <p className="text-xs text-slate-400 px-4 leading-relaxed">
              Do not close this app. Ensure your screen remains active to avoid tracking loss.
            </p>

            <Button 
              onClick={handleEndRide}
              className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white font-bold text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)]"
            >
              End Ride
            </Button>
          </div>
        </div>
      )}

    <div className="space-y-6 pb-12 text-slate-800" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Welcome back, {dashboardData?.agent?.name || "Arun Kumar"}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's your verification overview for today.</p>
        </div>
        
        {/* Date Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <FiCalendar className="w-4 h-4 text-gray-400" />
            <span>{currentDate}</span>
            <FiChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1.5">
              {Array.from({ length: 3 }).map((_, i) => {
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
                      "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                      currentDate === str ? "text-[#1E4DB7] font-semibold" : "text-gray-600"
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

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Assigned Cases */}
        <button
          onClick={() => handleKpiClick("Assigned")}
          className={cn(
            "bg-white rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md",
            activeKpi === "Assigned" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]" : "border-gray-100"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 mb-3">
            <FiBriefcase className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Assigned Cases</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{dashboardData?.kpis?.pending ?? 0}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
            <FiTrendingUp className="w-3.5 h-3.5" />
            <span>Active assigned</span>
          </div>
        </button>

        {/* 2. In Progress */}
        <button
          onClick={() => handleKpiClick("In Progress")}
          className={cn(
            "bg-white rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md",
            activeKpi === "In Progress" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]" : "border-gray-100"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 mb-3">
            <FiClock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">In Progress</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{dashboardData?.kpis?.inProgress ?? 0}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Under review</span>
          </div>
        </button>

        {/* 3. Completed */}
        <button
          onClick={() => handleKpiClick("Completed")}
          className={cn(
            "bg-white rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md",
            activeKpi === "Completed" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]" : "border-gray-100"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 mb-3">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Completed</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{dashboardData?.kpis?.completed ?? 0}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
            <FiTrendingUp className="w-3.5 h-3.5" />
            <span>Total verified</span>
          </div>
        </button>

        {/* 4. Rejected */}
        <button
          onClick={() => handleKpiClick("Rejected")}
          className={cn(
            "bg-white rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md",
            activeKpi === "Rejected" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]" : "border-gray-100"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600 mb-3">
            <FiAlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Rejected</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{dashboardData?.kpis?.rejected ?? 0}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-rose-600 hover:underline">
            <span>Declined/failed</span>
          </div>
        </button>

        {/* 5. Avg Time */}
        <div className="bg-white rounded-2xl p-4 text-left border border-gray-100 shadow-sm col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 mb-3">
            <FiClock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Avg. Time</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{dashboardData?.kpis?.avgTime || '—'}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-gray-400">
            <span>Per verification</span>
          </div>
        </div>
      </div>

      {/* ── 3-Column Dashboard Body ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Column 1: Assigned Cases */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-gray-900">Assigned Cases</h2>
              <Link href="/agent/cases" className="text-xs font-semibold text-[#1E4DB7] hover:underline">
                View all
              </Link>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-2">
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
                    setActiveKpi(null); // clear KPI filter when switching pills
                  }}
                  className={cn(
                    "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
                    selectedFilter === pill.label && !activeKpi
                      ? "text-white"
                      : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                  )}
                  style={selectedFilter === pill.label && !activeKpi ? { background: "#1E4DB7", borderColor: "#1E4DB7" } : {}}
                >
                  {pill.label} ({pill.count})
                </button>
              ))}
            </div>

            {/* Case List */}
            <div className="space-y-4">
              {getFilteredCases().length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs">
                  No cases found under this filter
                </div>
              ) : (
                getFilteredCases().map((c) => {
                  const p = c.status === "PENDING" || c.status === "ASSIGNED" ? "High" : c.status === "IN_PROGRESS" ? "Medium" : "Low";
                  return (
                    <div
                      key={c.id}
                      onClick={() => router.push(`/agent/cases/${c.id}`)}
                      className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-gray-50 bg-[#FAFBFD] hover:bg-gray-50 cursor-pointer transition-all"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                            p === "High" ? "bg-rose-100 text-rose-700" :
                            p === "Medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                          )}>
                            {p}
                          </span>
                          <span className="text-[11px] font-mono text-gray-400 font-semibold">{c.id}</span>
                        </div>
                        <h4 className="text-[14px] font-bold text-gray-900 leading-snug">{c.customer}</h4>
                        <p className="text-[12px] text-gray-400 truncate leading-snug">{c.address}</p>
                        <p className="text-[11px] font-medium text-gray-500">
                          {c.type === 'RESIDENTIAL' || c.type === 'ADDRESS' ? 'Residential Verification' : 'Business Verification'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                        <span className="text-[11px] text-[#1E4DB7] font-semibold flex items-center gap-1">
                          <FiMapPin className="w-3.5 h-3.5" />
                          {c.distance || "3.2 km away"}
                        </span>
                        <FiChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 mt-4 text-center">
            <Link href="/agent/cases" className="text-xs font-bold text-[#1E4DB7] hover:underline flex items-center justify-center gap-1.5">
              <span>View all assigned cases</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Column 2: Today's Schedule */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-gray-900">Today's Schedule</h2>
              <button 
                onClick={triggerMultiRouteNavigation} 
                className="text-xs font-semibold text-[#1E4DB7] hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed" 
                disabled={destinations.length === 0}
              >
                View route
              </button>
            </div>

            {/* Route Map (SVG route vector matching design) */}
            <div className="h-44 relative overflow-hidden mb-4">
              <ScheduleRouteMap agentLat={agentCoords.lat} agentLng={agentCoords.lng} destinations={destinations} />
            </div>

            {/* Schedule List */}
            <div className="space-y-3">
              {!dashboardData?.todaySchedule || dashboardData.todaySchedule.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No active verifications scheduled for today.
                </div>
              ) : (
                dashboardData.todaySchedule.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 p-2 bg-[#FAFBFD] rounded-xl border border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white",
                        s.num === 1 ? "bg-rose-500" :
                        s.num === 2 ? "bg-amber-500" :
                        s.num === 3 ? "bg-blue-600" : "bg-slate-500"
                      )}>{s.num}</div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{s.type}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-semibold text-gray-500">{s.time}</p>
                      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5", s.bg)}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={handleStartRide}
            disabled={loading}
            className="w-full mt-4 bg-[#1E4DB7] text-white hover:bg-blue-800 disabled:opacity-50 disabled:hover:bg-[#1E4DB7] py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <FiMapPin className="w-5 h-5" />
            <span>Start Ride Tracking</span>
          </button>
        </div>

        {/* Column 3: Stats & Actions */}
        <div className="space-y-6">
          {/* Card 1: Current Case */}
          {(() => {
            const currentActiveCase = liveCases.find((c: any) => ["ASSIGNED", "PENDING", "IN_PROGRESS"].includes(c.status)) || liveCases[0];
            return (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-bold text-gray-900">Current Case</h2>
                  {currentActiveCase && (
                    <Link href={`/agent/cases/${currentActiveCase.id}`} className="text-xs font-semibold text-[#1E4DB7] hover:underline">
                      View details
                    </Link>
                  )}
                </div>
                
                {currentActiveCase ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold text-gray-400">{currentActiveCase.id}</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{currentActiveCase.status}</span>
                    </div>
                    <h3 className="text-[15px] font-bold text-gray-900">{currentActiveCase.customer}</h3>
                    <p className="text-[11px] font-semibold text-gray-400">{currentActiveCase.type === 'BUSINESS' ? 'Business' : 'Residential'} Verification</p>
                    
                    <div className="flex items-start gap-1.5 bg-gray-50 p-2.5 rounded-xl">
                      <FiMapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 leading-snug">{currentActiveCase.address}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400">No active cases assigned</p>
                  </div>
                )}

                <button
                  onClick={() => currentActiveCase && router.push(`/agent/verify/${currentActiveCase.id}`)}
                  className="w-full text-white py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                  style={{ background: "#1E4DB7" }}
                >
                  <span>{['APPROVED', 'COMPLETED', 'REJECTED'].includes(currentActiveCase?.status) ? "View Verification Details" : "Continue Verification"}</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })()}

          {/* Card 2: Verification Progress */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900">Verification Progress</h2>
              <Link href="/agent/cases" className="text-xs font-semibold text-[#1E4DB7] hover:underline">
                View all
              </Link>
            </div>

            {(() => {
              const total = dashboardData?.kpis?.total ?? 0;
              const completed = dashboardData?.kpis?.completed ?? 0;
              const inProgress = dashboardData?.kpis?.inProgress ?? 0;
              const pending = dashboardData?.kpis?.pending ?? 0;
              const rejected = dashboardData?.kpis?.rejected ?? 0;
              const completedPercent = total === 0 ? 0 : Math.round((completed / total) * 100);
              return (
                <>
                  <div className="flex items-center gap-6">
                    {/* Radial Progress Chart SVG */}
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="38" className="text-gray-100" strokeWidth="6" stroke="currentColor" fill="transparent" />
                        <circle cx="48" cy="48" r="38" className="text-teal-500" strokeWidth="7" strokeDasharray={238} strokeDashoffset={238 - (238 * completedPercent) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-[16px] font-black text-gray-900">{completedPercent}%</span>
                        <p className="text-[9px] text-gray-400 font-semibold leading-tight">Completed</p>
                      </div>
                    </div>

                    {/* Legend matching reference image */}
                    <div className="space-y-1.5 flex-1 text-xs font-semibold text-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span>Completed</span>
                        </div>
                        <span className="text-gray-900">{completed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          <span>In Progress</span>
                        </div>
                        <span className="text-gray-900">{inProgress}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span>Pending</span>
                        </div>
                        <span className="text-gray-900">{pending}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <span>Rejected</span>
                        </div>
                        <span className="text-gray-900">{rejected}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-3 text-center">
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold">Total Cases</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{total}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold">This Month</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{total}</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Card 3: Quick Actions */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-gray-900">Quick Actions</h2>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={triggerCamera}
                className="flex items-center gap-2 px-3 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-left group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1E4DB7] shrink-0">
                  <FiCamera className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-900 leading-tight">Capture Photo</p>
                </div>
              </button>

              <button
                onClick={triggerAddRemark}
                className="flex items-center gap-2 px-3 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-left group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1E4DB7] shrink-0">
                  <FiMessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-900 leading-tight">Add Remark</p>
                </div>
              </button>

              <button
                onClick={triggerCall}
                className="flex items-center gap-2 px-3 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-left group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1E4DB7] shrink-0">
                  <FiPhone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-900 leading-tight">Call Customer</p>
                </div>
              </button>

              <button
                onClick={triggerUpload}
                className="flex items-center gap-2 px-3 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-left group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1E4DB7] shrink-0">
                  <FiUpload className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-900 leading-tight">Upload Document</p>
                </div>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
    </>
  );
}
