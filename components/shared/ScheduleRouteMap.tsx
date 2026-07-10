"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Destination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
}

interface ScheduleRouteMapProps {
  agentLat: number;
  agentLng: number;
  destinations: Destination[];
}

export default function ScheduleRouteMap({ agentLat, agentLng, destinations }: ScheduleRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize MapLibre Map
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [agentLng, agentLat],
      zoom: 12,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      drawElements();
    });

    return () => {
      map.remove();
    };
  }, []);

  // Redraw markers and route whenever coords or destinations update
  useEffect(() => {
    if (mapRef.current && mapRef.current.loaded()) {
      drawElements();
    }
  }, [agentLat, agentLng, destinations]);

  const drawElements = () => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Clear existing route layer & source
    if (map.getLayer("route-line")) map.removeLayer("route-line");
    if (map.getSource("route-source")) map.removeSource("route-source");

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([agentLng, agentLat]);

    // 1. Add Agent Marker (Blue Dot/Pin)
    const agentEl = document.createElement("div");
    agentEl.className = "w-6 h-6 rounded-full bg-blue-600 border-4 border-white shadow-md flex items-center justify-center relative";
    agentEl.innerHTML = `<span class="absolute w-full h-full rounded-full bg-blue-400 opacity-60 animate-ping"></span>`;
    
    const agentMarker = new maplibregl.Marker({ element: agentEl })
      .setLngLat([agentLng, agentLat])
      .setPopup(
        new maplibregl.Popup({ offset: 15 }).setHTML(
          `<div class="p-1.5"><p class="font-bold text-xs text-slate-800">Your Live GPS Location</p></div>`
        )
      )
      .addTo(map);

    markersRef.current.push(agentMarker);

    // 2. Add Destination Markers (Numbered Red/Amber Pins)
    const coordinates: [number, number][] = [[agentLng, agentLat]];

    destinations.forEach((dest, idx) => {
      const colors = ["#EF4444", "#F59E0B", "#2563EB", "#6B7280"];
      const color = colors[idx] || "#EF4444";

      const destEl = document.createElement("div");
      destEl.className = "w-6 h-6 rounded-full border-2 border-white shadow flex items-center justify-center text-[10px] font-bold text-white";
      destEl.style.backgroundColor = color;
      destEl.textContent = String(idx + 1);

      const marker = new maplibregl.Marker({ element: destEl })
        .setLngLat([dest.lng, dest.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 15 }).setHTML(
            `<div class="p-2 space-y-1">
              <p class="font-bold text-xs text-[#1E4DB7]">Stop ${idx + 1}: ${dest.name}</p>
              <p class="text-[10px] text-gray-500">${dest.address}</p>
            </div>`
          )
        )
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([dest.lng, dest.lat]);
      coordinates.push([dest.lng, dest.lat]);
    });

    // 3. Draw Path Line (Polyline connecting Agent to all stops)
    if (coordinates.length > 1) {
      map.addSource("route-source", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#1E4DB7",
          "line-width": 3,
          "line-dasharray": [2, 1.5],
        },
      });

      // Fit map to show all markers
      map.fitBounds(bounds, {
        padding: 40,
        maxZoom: 14,
        duration: 800,
      });
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "176px" }} />
    </div>
  );
}
