import { geocodeAddressApi } from "./api";

export interface GeocodeResult {
  lat: number | null;
  lng: number | null;
  accuracy: "house" | "street" | "city" | "unknown";
  source: "cache" | "osm" | "dictionary" | "unknown" | "stored";
  displayName?: string;
}

// In-memory client-side cache to avoid repeated calls within a session
const clientCache = new Map<string, GeocodeResult>();

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
    const result: GeocodeResult = res.data?.data ?? {
      lat: null,
      lng: null,
      accuracy: "unknown",
      source: "unknown",
    };
    clientCache.set(cacheKey, result);
    return result;
  } catch {
    // Network/auth failure — never fabricate coordinates
    const fallback: GeocodeResult = {
      lat: null,
      lng: null,
      accuracy: "unknown",
      source: "unknown",
    };
    clientCache.set(cacheKey, fallback);
    return fallback;
  }
}