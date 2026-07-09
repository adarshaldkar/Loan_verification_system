"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({ lat, lng, onChange }: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize MapLibre Map
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json", // Premium clean light style
      center: [lng, lat],
      zoom: 13,
    });

    mapRef.current = map;

    // Add Navigation Control (zoom/rotate buttons)
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    // Add Marker
    const marker = new maplibregl.Marker({
      draggable: true,
      color: "#1E4DB7", // Matching our theme color
    })
      .setLngLat([lng, lat])
      .addTo(map);

    markerRef.current = marker;

    // Handle Drag End to Update Location
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      onChange(lngLat.lat, lngLat.lng);
    });

    // Handle Map Click to Move Marker and Update Location
    map.on("click", (e) => {
      const { lng: clickedLng, lat: clickedLat } = e.lngLat;
      marker.setLngLat([clickedLng, clickedLat]);
      onChange(clickedLat, clickedLng);
    });

    // Clean up map on unmount
    return () => {
      map.remove();
    };
  }, []);

  // Update marker position if coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      const currentLngLat = markerRef.current.getLngLat();
      if (currentLngLat.lat !== lat || currentLngLat.lng !== lng) {
        markerRef.current.setLngLat([lng, lat]);
        mapRef.current.easeTo({ center: [lng, lat] });
      }
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "220px" }} />
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[9px] font-bold text-gray-500 shadow-sm pointer-events-none">
        Drag marker or click map to update coordinates
      </div>
    </div>
  );
}
