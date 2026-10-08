"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FiNavigation, FiCrosshair } from "react-icons/fi";
import { toast } from "sonner";

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

// Highly reliable OpenStreetMap raster style (No API keys needed, zero CORS blocks)
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

export default function LocationPickerMap({ lat, lng, onChange }: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [locating, setLocating] = useState(false);

  // Safe fallback coordinates (India center / Bangalore) if lat/lng are 0 or null
  const validLat = lat && lat !== 0 ? lat : 12.9716;
  const validLng = lng && lng !== 0 ? lng : 77.5946;

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

    // Add Navigation Control
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    // Add Draggable Marker
    const marker = new maplibregl.Marker({
      draggable: true,
      color: "#1E4DB7",
    })
      .setLngLat([validLng, validLat])
      .addTo(map);

    markerRef.current = marker;

    // Handle Drag End to Update Location
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      const newLat = parseFloat(lngLat.lat.toFixed(6));
      const newLng = parseFloat(lngLat.lng.toFixed(6));
      onChange(newLat, newLng);
    });

    // Handle Map Click to Move Marker and Update Location
    map.on("click", (e) => {
      const { lng: clickedLng, lat: clickedLat } = e.lngLat;
      const newLat = parseFloat(clickedLat.toFixed(6));
      const newLng = parseFloat(clickedLng.toFixed(6));
      marker.setLngLat([newLng, newLat]);
      onChange(newLat, newLng);
    });

    return () => {
      map.remove();
    };
  }, []);

  // Update marker position if coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapRef.current && lat && lng) {
      const currentLngLat = markerRef.current.getLngLat();
      if (Math.abs(currentLngLat.lat - lat) > 0.0001 || Math.abs(currentLngLat.lng - lng) > 0.0001) {
        markerRef.current.setLngLat([lng, lat]);
        mapRef.current.easeTo({ center: [lng, lat], zoom: 15 });
      }
    }
  }, [lat, lng]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const userLat = parseFloat(pos.coords.latitude.toFixed(6));
        const userLng = parseFloat(pos.coords.longitude.toFixed(6));
        onChange(userLat, userLng);
        if (markerRef.current && mapRef.current) {
          markerRef.current.setLngLat([userLng, userLat]);
          mapRef.current.easeTo({ center: [userLng, userLat], zoom: 16 });
        }
        toast.success(`Current GPS captured (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setLocating(false);
        toast.error("Could not fetch GPS location. Please allow location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "240px" }} />
      
      {/* Locate Me Floating Button */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        className="absolute top-3 left-3 bg-white/95 hover:bg-white text-slate-800 border border-slate-200 shadow-md px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 z-10 cursor-pointer disabled:opacity-50"
      >
        <FiCrosshair className={`w-3.5 h-3.5 text-blue-600 ${locating ? "animate-spin" : ""}`} />
        <span>{locating ? "Locating..." : "Locate Me (GPS)"}</span>
      </button>

      {/* Floating Instructions */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-semibold text-slate-600 shadow-sm pointer-events-none border border-slate-100 z-10">
        📍 Drag marker or tap anywhere on map to adjust coordinates
      </div>
    </div>
  );
}
