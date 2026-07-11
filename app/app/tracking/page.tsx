"use client";

import { useEffect, useState, useRef } from "react";
import { getActiveRidesApi, getRideHistoryApi } from "@/lib/api";
import { toast } from "sonner";
import { FiMapPin, FiNavigation, FiClock, FiActivity } from "react-icons/fi";
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
  type MapRef 
} from "@/components/ui/map";

// Reliable OpenStreetMap style schema
const osmStyle = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19
    }
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm"
    }
  ]
} as any;

export default function TrackingPage() {
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);
  
  const mapRef = useRef<MapRef | null>(null);

  // Load Active Rides dynamically
  useEffect(() => {
    async function loadActiveRides() {
      try {
        const res = await getActiveRidesApi();
        setActiveRides(res.data.data);
      } catch (err: any) {
        toast.error("Failed to load active rides");
      } finally {
        setLoading(false);
      }
    }
    loadActiveRides();
    const interval = setInterval(loadActiveRides, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fit bounds to show all active rides on initial load
  useEffect(() => {
    if (!mapRef.current || activeRides.length === 0 || selectedRideId) return;

    const bounds = new maplibregl.LngLatBounds();
    let hasPoints = false;

    activeRides.forEach((ride) => {
      if (ride.locations.length > 0) {
        const loc = ride.locations[0];
        bounds.extend([loc.longitude, loc.latitude]);
        hasPoints = true;
      }
    });

    if (hasPoints) {
      // Small timeout to allow map instance sizing to complete
      setTimeout(() => {
        mapRef.current?.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }, 200);
    }
  }, [activeRides, selectedRideId]);

  // Fit bounds to show full route path on selection
  useEffect(() => {
    if (!mapRef.current || !selectedHistory || selectedHistory.locations.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    selectedHistory.locations.forEach((l: any) => {
      bounds.extend([l.longitude, l.latitude]);
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
    } catch (err: any) {
      toast.error("Failed to load ride history");
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      
      {/* Sidebar: Active Rides */}
      <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden h-full">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FiActivity className="text-emerald-500" />
            Live Agent Tracking
          </h2>
          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {activeRides.length} Active
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
             <div className="space-y-4">
               <Skeleton className="h-20 w-full rounded-xl" />
               <Skeleton className="h-20 w-full rounded-xl" />
             </div>
          ) : activeRides.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <FiMapPin className="mx-auto h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No agents are currently driving.</p>
            </div>
          ) : (
            activeRides.map(ride => (
              <div 
                key={ride.id}
                onClick={() => handleSelectRide(ride.id)}
                className={cn(
                  "p-4 rounded-xl border transition-all cursor-pointer",
                  selectedRideId === ride.id 
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/20" 
                    : "border-gray-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{ride.agent.firstName} {ride.agent.lastName}</div>
                  <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                    {ride.totalDistance.toFixed(2)} km
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <FiClock /> 
                    <span>{new Date(ride.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiNavigation />
                    <span>{ride.locations[0]?.speed ? `${(ride.locations[0].speed * 3.6).toFixed(1)} km/h` : 'Stopped'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map Area using mapcn.dev */}
      <div className="w-full md:w-2/3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden relative min-h-[400px] h-full">
        
        <Map 
          ref={mapRef} 
          styles={{ light: osmStyle, dark: osmStyle }} 
          center={[78.7047, 10.7905]} 
          zoom={6}
          maxZoom={19}
        >
          <MapControls showZoom showFullscreen />

          {/* Active Agents Markers */}
          {activeRides.map(ride => {
            if (ride.locations.length === 0) return null;
            const loc = ride.locations[0];
            return (
              <MapMarker 
                key={ride.id} 
                longitude={loc.longitude} 
                latitude={loc.latitude}
              >
                <MarkerContent>
                  <div 
                    onClick={() => handleSelectRide(ride.id)}
                    className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-white shadow-lg overflow-hidden flex items-center justify-center relative cursor-pointer group"
                  >
                    <div className="absolute inset-0 bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-colors"></div>
                    <span className="font-bold text-xs text-slate-800 relative z-10">
                      {ride.agent.firstName[0]}{ride.agent.lastName[0]}
                    </span>
                  </div>
                </MarkerContent>
                <MarkerPopup>
                  <div className="p-2 text-sm text-slate-800">
                    <div className="font-bold mb-1">{ride.agent.firstName} {ride.agent.lastName}</div>
                    <div className="text-xs text-slate-500">Speed: {loc.speed ? (loc.speed * 3.6).toFixed(1) : 0} km/h</div>
                    <div className="text-xs text-slate-500">Distance: {ride.totalDistance.toFixed(2)} km</div>
                  </div>
                </MarkerPopup>
              </MapMarker>
            );
          })}

          {/* Driven path breadcrumb route line */}
          {selectedHistory && selectedHistory.locations.length >= 2 && (
            <MapRoute 
              coordinates={selectedHistory.locations.map((l: any) => [l.longitude, l.latitude])}
              color="#10B981"
              width={6}
              opacity={0.8}
            />
          )}

        </Map>
        
        {/* Floating Legend overlay */}
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></div>
            <span>Live Agent Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-emerald-500 rounded-full"></div>
            <span>Driven Route (History)</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
