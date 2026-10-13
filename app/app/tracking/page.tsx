"use client";

import { useEffect, useState, useRef } from "react";
import {
  getActiveRidesApi,
  getRideHistoryApi,
  forceEndRideApi,
  getReimbursementClaimsApi,
  updateReimbursementStatusApi,
  getFuelRateSettingApi,
  updateFuelRateSettingApi,
} from "@/lib/api";
import { toast } from "sonner";
import {
  FiMapPin,
  FiNavigation,
  FiClock,
  FiActivity,
  FiStopCircle,
  FiDollarSign,
  FiCheck,
  FiX,
  FiDownload,
  FiSettings,
  FiRefreshCw,
  FiFileText,
} from "react-icons/fi";
import maplibregl from "maplibre-gl";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapRoute,
  type MapRef,
} from "@/components/ui/map";

// OpenStreetMap tiles schema
const osmStyle = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
} as any;

export default function TrackingPage() {
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);

  // Reimbursements modal & settings state
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [reimbursementData, setReimbursementData] = useState<{ claims: any[]; summary: any } | null>(null);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [claimsFilter, setClaimsFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  // Fuel Rate Configuration state
  const [fuelRate, setFuelRate] = useState<number>(3.5);
  const [editingFuelRate, setEditingFuelRate] = useState(false);
  const [tempFuelRate, setTempFuelRate] = useState("3.5");

  const mapRef = useRef<MapRef | null>(null);
  const prevRideCountRef = useRef(0);

  // Load Active Rides dynamically every 10s
  const loadActiveRides = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await getActiveRidesApi();
      setActiveRides(res.data.data || []);
    } catch {
      if (!silent) toast.error("Failed to load active rides");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveRides();
    const interval = setInterval(() => loadActiveRides(true), 10000);
    return () => clearInterval(interval);
  }, []);

  // Load Fuel Rate Setting on mount
  useEffect(() => {
    async function loadFuelRate() {
      try {
        const res = await getFuelRateSettingApi();
        if (res.data?.data?.fuelRatePerKm) {
          setFuelRate(res.data.data.fuelRatePerKm);
          setTempFuelRate(res.data.data.fuelRatePerKm.toString());
        }
      } catch {}
    }
    loadFuelRate();
  }, []);

  // Fit bounds to show all active rides on initial load
  useEffect(() => {
    if (!mapRef.current || activeRides.length === 0 || selectedRideId) return;

    const isNewRide = activeRides.length > prevRideCountRef.current;
    prevRideCountRef.current = activeRides.length;
    if (!isNewRide && prevRideCountRef.current > 1) return;

    const bounds = new maplibregl.LngLatBounds();
    let hasPoints = false;

    activeRides.forEach((ride) => {
      const loc = ride.latestLocation || (ride.locations && ride.locations[0]);
      if (loc && typeof loc.longitude === "number" && typeof loc.latitude === "number") {
        bounds.extend([loc.longitude, loc.latitude]);
        hasPoints = true;
      }
    });

    if (hasPoints) {
      setTimeout(() => {
        mapRef.current?.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      }, 200);
    }
  }, [activeRides, selectedRideId]);

  // Fit bounds to show full route path on selection
  useEffect(() => {
    if (!mapRef.current || !selectedHistory || !selectedHistory.locations || selectedHistory.locations.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    selectedHistory.locations.forEach((l: any) => {
      if (typeof l.longitude === "number" && typeof l.latitude === "number") {
        bounds.extend([l.longitude, l.latitude]);
      }
    });

    setTimeout(() => {
      mapRef.current?.fitBounds(bounds, { padding: 80 });
    }, 200);
  }, [selectedHistory]);

  const handleSelectRide = async (rideId: string) => {
    setSelectedRideId(rideId);
    try {
      const res = await getRideHistoryApi(rideId);
      setSelectedHistory(res.data.data);
    } catch {
      toast.error("Failed to load ride history");
    }
  };

  const handleEndRide = async (rideId: string) => {
    const ride = activeRides.find((r) => r.id === rideId);
    const agentName = ride ? `${ride.agent?.firstName ?? ""} ${ride.agent?.lastName ?? ""}`.trim() : "this agent";
    if (!window.confirm(`Stop tracking for ${agentName}? This will finalize their odometer distance and submit their fuel allowance claim.`)) {
      return;
    }
    try {
      await forceEndRideApi(rideId);
      toast.success(`${agentName}'s ride concluded & distance finalized`);
      setActiveRides((prev) => prev.filter((r) => r.id !== rideId));
      if (selectedRideId === rideId) {
        setSelectedRideId(null);
        setSelectedHistory(null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to end ride");
    }
  };

  // Load Reimbursement Claims
  const loadReimbursementClaims = async () => {
    try {
      setLoadingClaims(true);
      const res = await getReimbursementClaimsApi({
        status: claimsFilter === "ALL" ? undefined : claimsFilter,
      });
      setReimbursementData(res.data.data);
    } catch {
      toast.error("Failed to load reimbursement claims");
    } finally {
      setLoadingClaims(false);
    }
  };

  useEffect(() => {
    if (showReimbursementModal) {
      loadReimbursementClaims();
    }
  }, [showReimbursementModal, claimsFilter]);

  const handleUpdateClaim = async (rideId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await updateReimbursementStatusApi(rideId, { status });
      toast.success(`Claim marked as ${status}`);
      loadReimbursementClaims();
    } catch {
      toast.error("Failed to update claim status");
    }
  };

  const handleSaveFuelRate = async () => {
    const num = parseFloat(tempFuelRate);
    if (isNaN(num) || num <= 0 || num > 50) {
      toast.error("Please enter a valid rate between ₹0.1 and ₹50 per km");
      return;
    }
    try {
      await updateFuelRateSettingApi(num);
      setFuelRate(num);
      setEditingFuelRate(false);
      toast.success(`Fuel reimbursement rate updated to ₹${num.toFixed(2)}/km`);
    } catch {
      toast.error("Failed to update fuel rate");
    }
  };

  // Export claims to CSV
  const exportClaimsToCSV = () => {
    if (!reimbursementData?.claims?.length) {
      toast.error("No claims available to export");
      return;
    }
    const headers = ["Ride ID", "Date", "Agent Name", "Phone", "Branch", "Total Distance (KM)", "Rate (₹/km)", "Fuel Cost (₹)", "Status"];
    const rows = reimbursementData.claims.map((c) => [
      c.id,
      new Date(c.createdAt).toLocaleDateString(),
      `${c.agent?.firstName || ""} ${c.agent?.lastName || ""}`.trim(),
      c.agent?.phone || "",
      c.agent?.branch || "",
      (c.totalDistance || 0).toFixed(2),
      c.fuelRatePerKm || fuelRate,
      (c.fuelCost || 0).toFixed(2),
      c.reimbursementStatus || "PENDING",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Fuel_Claims_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Fuel claims report downloaded!");
  };

  return (
    <div className="space-y-4">
      {/* ── Top Bar with Fuel Allowance Info & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            🛵
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Live Agent Tracking & Mileage Odometer</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">
                {activeRides.length} Active
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time GPS telemetry, anti-fraud movement states, and auto-calculated petrol allowances.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Rate Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Rate:</span>
            {editingFuelRate ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={tempFuelRate}
                  onChange={(e) => setTempFuelRate(e.target.value)}
                  className="w-16 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold"
                />
                <button onClick={handleSaveFuelRate} className="text-emerald-600 hover:text-emerald-500 font-bold">
                  ✓
                </button>
                <button onClick={() => setEditingFuelRate(false)} className="text-rose-500 hover:text-rose-400 font-bold">
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingFuelRate(true)}
                className="font-bold text-[#1E4DB7] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                title="Click to edit company fuel rate"
              >
                <span>₹{fuelRate.toFixed(2)}/km</span>
                <FiSettings className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowReimbursementModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-[#1E4DB7] dark:text-blue-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <FiDollarSign className="w-4 h-4 text-emerald-600" />
            <span>Fuel Reimbursements</span>
          </button>

          <button
            onClick={() => loadActiveRides()}
            disabled={loading}
            className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh map"
          >
            <FiRefreshCw className={cn("w-4 h-4", loading && "animate-spin text-blue-600")} />
          </button>
        </div>
      </div>

      {/* ── Main Map & Telemetry Layout ── */}
      <div className="h-[calc(100vh-14rem)] flex flex-col md:flex-row gap-5">
        {/* Left Column: Active Agents Cards */}
        <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden h-full">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
            <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FiActivity className="text-emerald-500" />
              <span>Active Field Riders</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Auto-refreshes 10s</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : activeRides.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                <div className="text-4xl mb-2">🛵</div>
                <p className="text-sm font-semibold">No active riders on the road</p>
                <p className="text-xs text-slate-400 mt-1">When an agent taps "Start Ride", their live marker appears here.</p>
              </div>
            ) : (
              activeRides.map((ride) => {
                const agentName = ride.agent
                  ? `${ride.agent.firstName || ""} ${ride.agent.lastName || ""}`.trim()
                  : "Field Agent";
                const loc = ride.latestLocation || (ride.locations && ride.locations[0]);
                const speedKmh = loc?.speed && loc.speed > 0 ? (loc.speed * 3.6).toFixed(1) : "0.0";
                const status = ride.movementStatus || "IDLE";
                const isSelected = selectedRideId === ride.id;

                return (
                  <div
                    key={ride.id}
                    onClick={() => handleSelectRide(ride.id)}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                      isSelected
                        ? "border-[#1E4DB7] bg-blue-50/50 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20"
                        : "border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                          🛵
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{agentName}</span>
                            <span
                              className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                                status === "MOVING"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : status === "ON_SITE"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              )}
                            >
                              {status === "MOVING" ? "Moving" : status === "ON_SITE" ? "On-Site" : "Idle"}
                            </span>
                          </div>
                          {ride.agent?.branch && (
                            <p className="text-[11px] text-slate-400 font-medium">{ride.agent.branch}</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleEndRide(ride.id);
                        }}
                        title="Force End Ride Session"
                        className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <FiStopCircle className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Stats Pill Row */}
                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">Odometer</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                          {(ride.totalDistance || 0).toFixed(2)} km
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">Speed</span>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                          {speedKmh} km/h
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">Fuel Claim</span>
                        <p className="font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                          ₹{(ride.fuelCost || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Ping Recency */}
                    <div className="flex items-center justify-between mt-2 pt-1.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        <span>Started {new Date(ride.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </span>
                      <span className="font-medium text-slate-500 dark:text-slate-400">
                        {ride.secondsAgo != null && ride.secondsAgo < 120
                          ? `Signal ${ride.secondsAgo}s ago`
                          : "No recent signal"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live MapLibre Map */}
        <div className="w-full md:w-2/3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden relative min-h-[400px] h-full shadow-sm">
          <Map
            ref={mapRef}
            styles={{ light: osmStyle, dark: osmStyle }}
            center={[78.7047, 10.7905]}
            zoom={6}
            maxZoom={19}
          >
            <MapControls showZoom showFullscreen />

            {/* Active Agent Bike Markers (Rapido/Swiggy Style) */}
            {activeRides.map((ride) => {
              const loc = ride.latestLocation || (ride.locations && ride.locations[0]);
              if (!loc || typeof loc.longitude !== "number" || typeof loc.latitude !== "number") return null;

              const isSelected = selectedRideId === ride.id;
              const status = ride.movementStatus || "IDLE";
              const speedKmh = loc.speed && loc.speed > 0 ? (loc.speed * 3.6).toFixed(1) : "0.0";

              return (
                <MapMarker key={ride.id} longitude={loc.longitude} latitude={loc.latitude}>
                  <MarkerContent>
                    <div
                      onClick={() => handleSelectRide(ride.id)}
                      className={cn(
                        "transition-all duration-300 transform hover:scale-110 cursor-pointer flex flex-col items-center",
                        isSelected && "scale-115"
                      )}
                    >
                      {/* Name badge floating above marker */}
                      <div className="px-2 py-0.5 rounded-md bg-slate-900/90 text-white text-[10px] font-bold shadow-md whitespace-nowrap mb-1 border border-slate-700/60 flex items-center gap-1">
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            status === "MOVING" ? "bg-emerald-400 animate-pulse" : status === "ON_SITE" ? "bg-amber-400" : "bg-slate-400"
                          )}
                        />
                        <span>{ride.agent?.firstName || "Agent"}</span>
                        <span className="text-amber-300 font-mono text-[9px]">{speedKmh} km/h</span>
                      </div>

                      {/* Swiggy/Rapido Bike Marker Bubble */}
                      <div
                        className={cn(
                          "w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-xl relative border-2 transition-all",
                          isSelected
                            ? "bg-[#1E4DB7] border-white text-white shadow-blue-500/50 ring-4 ring-blue-500/30"
                            : status === "MOVING"
                            ? "bg-emerald-600 border-white text-white shadow-emerald-500/40"
                            : status === "ON_SITE"
                            ? "bg-amber-500 border-white text-white shadow-amber-500/40"
                            : "bg-slate-800 border-white text-white shadow-slate-900/40"
                        )}
                      >
                        <span>🛵</span>
                      </div>
                    </div>
                  </MarkerContent>

                  <MarkerPopup>
                    <div className="p-2 text-sm text-slate-800 space-y-1">
                      <div className="font-bold text-base flex items-center gap-1.5">
                        <span>🛵</span>
                        <span>{ride.agent?.firstName} {ride.agent?.lastName}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Branch: {ride.agent?.branch || "N/A"}</span>
                        <span>•</span>
                        <span>Speed: {speedKmh} km/h</span>
                      </div>
                      <div className="text-xs font-semibold text-emerald-700 pt-1 border-t border-slate-200">
                        Odometer: {(ride.totalDistance || 0).toFixed(2)} km • Petrol: ₹{(ride.fuelCost || 0).toFixed(2)}
                      </div>
                    </div>
                  </MarkerPopup>
                </MapMarker>
              );
            })}

            {/* Selected Ride Historical Route Breadcrumb Line */}
            {selectedHistory && selectedHistory.locations && selectedHistory.locations.length >= 2 && (
              <MapRoute
                coordinates={selectedHistory.locations.map((l: any) => [l.longitude, l.latitude])}
                color="#1E4DB7"
                width={5}
                opacity={0.85}
              />
            )}
          </Map>

          {/* Floating Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur p-3 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 z-10 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Moving (&gt;4 km/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">On-Site (At Stop)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-[#1E4DB7] rounded-full" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Live GPS Trail</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fuel Claims & Reimbursements Modal ── */}
      {showReimbursementModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-xl shrink-0">
                  ⛽
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    Field Mileage & Fuel Reimbursement Claims
                  </h3>
                  <p className="text-xs text-slate-400">
                    Review and approve GPS-verified travel claims calculated at ₹{fuelRate}/km.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportClaimsToCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <FiDownload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setShowReimbursementModal(false)}
                  className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            {reimbursementData?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-gray-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Verified KM</p>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                    {reimbursementData.summary.totalDistance} km
                  </p>
                </div>
                <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-center">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-semibold">Total Claimed</p>
                  <p className="text-lg font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">
                    ₹{reimbursementData.summary.totalClaimed}
                  </p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-center">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Total Approved</p>
                  <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    ₹{reimbursementData.summary.totalApproved}
                  </p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-center">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-semibold">Pending Review</p>
                  <p className="text-lg font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">
                    {reimbursementData.summary.pendingCount}
                  </p>
                </div>
              </div>
            )}

            {/* Filter Pills */}
            <div className="flex gap-2 pb-3">
              {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setClaimsFilter(tab)}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                    claimsFilter === tab
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Claims Table */}
            <div className="flex-1 overflow-y-auto border border-gray-100 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold sticky top-0 border-b border-gray-100 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Agent</th>
                    <th className="py-2.5 px-3">Branch</th>
                    <th className="py-2.5 px-3">Odometer (KM)</th>
                    <th className="py-2.5 px-3">Fuel Claim</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {loadingClaims ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        Loading fuel claims...
                      </td>
                    </tr>
                  ) : !reimbursementData?.claims?.length ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No reimbursement claims found.
                      </td>
                    </tr>
                  ) : (
                    reimbursementData.claims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(claim.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                          {claim.agent?.firstName} {claim.agent?.lastName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{claim.agent?.branch || "N/A"}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {(claim.totalDistance || 0).toFixed(2)} km
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                          ₹{(claim.fuelCost || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              claim.reimbursementStatus === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : claim.reimbursementStatus === "REJECTED"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            )}
                          >
                            {claim.reimbursementStatus || "PENDING"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {claim.reimbursementStatus === "PENDING" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateClaim(claim.id, "APPROVED")}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateClaim(claim.id, "REJECTED")}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Decided</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
