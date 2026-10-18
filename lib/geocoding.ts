import { geocodeAddressApi } from "./api";

export interface GeocodeResult {
  lat: number | null;
  lng: number | null;
  accuracy: "house" | "street" | "city" | "unknown";
  source: "cache" | "osm" | "dictionary" | "unknown" | "stored";
  displayName?: string;
}

export const KNOWN_CITY_ANCHORS: Record<string, { lat: number; lng: number }> = {
  puducherry: { lat: 11.9416, lng: 79.8083 },
  pondicherry: { lat: 11.9416, lng: 79.8083 },
  moolakulam: { lat: 11.9332, lng: 79.7892 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  tiruppur: { lat: 11.1085, lng: 77.3411 },
  pollachi: { lat: 10.6572, lng: 77.0087 },
  erode: { lat: 11.341, lng: 77.7172 },
  salem: { lat: 11.6643, lng: 78.146 },
  vellore: { lat: 12.9165, lng: 79.1325 },
  kumbakonam: { lat: 10.9602, lng: 79.3844 },
  thanjavur: { lat: 10.787, lng: 79.1378 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  hosur: { lat: 12.7409, lng: 77.8253 },
  cuddalore: { lat: 11.7447, lng: 79.7679 },
  villupuram: { lat: 11.9417, lng: 79.4922 },
  ooty: { lat: 11.4102, lng: 76.695 },
};

// In-memory client-side cache to avoid repeated calls within a session
const clientCache = new Map<string, GeocodeResult>();

export function lookupCityAnchor(rawAddress: string): { lat: number; lng: number } | null {
  if (!rawAddress) return null;
  const lower = rawAddress.toLowerCase();
  for (const [city, coords] of Object.entries(KNOWN_CITY_ANCHORS)) {
    if (lower.includes(city)) return coords;
  }
  return null;
}

export async function geocodeAddressDynamically(
  rawAddress: string
): Promise<GeocodeResult> {
  if (!rawAddress || !rawAddress.trim()) {
    return { lat: null, lng: null, accuracy: "unknown", source: "unknown" };
  }

  const cacheKey = rawAddress.trim().toLowerCase().replace(/\s+/g, " ");
  if (clientCache.has(cacheKey)) return clientCache.get(cacheKey)!;

  try {
    const res = await geocodeAddressApi(rawAddress);
    let result: GeocodeResult = res.data?.data ?? {
      lat: null,
      lng: null,
      accuracy: "unknown",
      source: "unknown",
    };

    if (result.lat == null || result.lng == null) {
      const anchor = lookupCityAnchor(rawAddress);
      if (anchor) {
        result = { lat: anchor.lat, lng: anchor.lng, accuracy: "city", source: "dictionary" };
      }
    }

    clientCache.set(cacheKey, result);
    return result;
  } catch {
    const anchor = lookupCityAnchor(rawAddress);
    const fallback: GeocodeResult = anchor
      ? { lat: anchor.lat, lng: anchor.lng, accuracy: "city", source: "dictionary" }
      : { lat: null, lng: null, accuracy: "unknown", source: "unknown" };
    clientCache.set(cacheKey, fallback);
    return fallback;
  }
}