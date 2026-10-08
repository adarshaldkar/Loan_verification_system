"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FiCrosshair, FiMapPin, FiNavigation } from "react-icons/fi";
import { toast } from "sonner";

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

// Highly reliable OpenStreetMap raster style (Zero API keys needed, no CORS blocks)
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

export default function LocationPickerMap({ lat, lng, onChange, height = "220px" }: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ lat: lat || 12.9716, lng: lng || 77.5946 });

  // Safe fallback coordinates
  const validLat = typeof lat === "number" && !isNaN(lat) && lat !== 0 ? lat : 12.9716;
  const validLng = typeof lng === "number" && !isNaN(lng) && lng !== 0 ? lng : 77.5946;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize MapLibre Map
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: osmStyle,
      center: [validLng, validLat],
      zoom: 14,
      maxZoom: 19,
    });

    mapRef.current = map;

    // Add Navigation Control on top right
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    // Custom glowing pin marker element
    const el = document.createElement("div");
    el.className = "custom-location-marker";
    el.style.width = "28px";
    el.style.height = "28px";
    el.style.borderRadius = "50%";
    el.style.backgroundColor = "#1E4DB7";
    el.style.border = "3px solid white";
    el.style.boxShadow = "0 0 12px rgba(30, 77, 183, 0.6)";
    el.style.cursor = "grab";

    // Add Draggable Marker
    const marker = new maplibregl.Marker({
      element: el,
      draggable: true,
    })
      .setLngLat([validLng, validLat])
      .addTo(map);

    markerRef.current = marker;

    // Handle Drag End to Update Location
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      const newLat = parseFloat(lngLat.lat.toFixed(6));
      const newLng = parseFloat(lngLat.lng.toFixed(6));
      setCurrentCoords({ lat: newLat, lng: newLng });
      onChange(newLat, newLng);
      toast.success(`Marker moved: ${newLat}, ${newLng}`);
    });

    // Handle Map Click to Move Marker
    map.on("click", (e) => {
      const { lng: clickedLng, lat: clickedLat } = e.lngLat;
      const newLat = parseFloat(clickedLat.toFixed(6));
      const newLng = parseFloat(clickedLng.toFixed(6));
      marker.setLngLat([newLng, newLat]);
      setCurrentCoords({ lat: newLat, lng: newLng });
      onChange(newLat, newLng);
    });

    // Trigger map resize on load & resize observer to prevent grey tile clipping
    map.on("load", () => {
      map.resize();
    });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
    };
  }, []);

  // Update marker position if coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapRef.current && lat && lng) {
      const currentLngLat = markerRef.current.getLngLat();
      if (Math.abs(currentLngLat.lat - lat) > 0.0001 || Math.abs(currentLngLat.lng - lng) > 0.0001) {
        markerRef.current.setLngLat([lng, lat]);
        setCurrentCoords({ lat, lng });
        mapRef.current.easeTo({ center: [lng, lat], zoom: 15 });
      }
    }
  }, [lat, lng]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const userLat = parseFloat(pos.coords.latitude.toFixed(6));
        const userLng = parseFloat(pos.coords.longitude.toFixed(6));
        setCurrentCoords({ lat: userLat, lng: userLng });
        onChange(userLat, userLng);
        if (markerRef.current && mapRef.current) {
          markerRef.current.setLngLat([userLng, userLat]);
          mapRef.current.flyTo({ center: [userLng, userLat], zoom: 16, essential: true });
        }
        toast.success(`Current GPS locked! (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setLocating(false);
        toast.error("Could not fetch GPS. Please ensure location permissions are enabled.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner group" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Locate Me Floating Button */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-slate-900/95 hover:bg-white text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-md px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 z-10 cursor-pointer disabled:opacity-50"
      >
        <FiCrosshair className={`w-3.5 h-3.5 text-[#1E4DB7] ${locating ? "animate-spin" : ""}`} />
        <span>{locating ? "Locating..." : "Locate Me (GPS)"}</span>
      </button>

      {/* Live Coordinate Badge Overlay */}
      <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-[10px] text-white flex items-center justify-between shadow-md border border-slate-700/60 z-10">
        <span className="flex items-center gap-1 font-mono">
          <FiMapPin className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>{currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}</span>
        </span>
        <span className="text-[9px] text-slate-300 font-sans hidden sm:inline">Tap map to set pin</span>
      </div>
    </div>
  );
}
