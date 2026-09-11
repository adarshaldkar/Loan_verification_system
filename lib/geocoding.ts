/**
 * Smart Dynamic Progressive Geocoder
 * Resolves raw unstructured Indian and global customer addresses to accurate GPS coordinates (Lat, Lng)
 * with multi-tier progressive query cleaning, Nominatim search, known locality mappings, and in-memory caching.
 */

// In-memory cache to prevent repeated network requests
const geocodeCache = new Map<string, { lat: number; lng: number }>();

// High-confidence geographical anchors for common Indian cities, districts, and regions
const KNOWN_REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  puducherry: { lat: 11.9416, lng: 79.8083 },
  pondicherry: { lat: 11.9416, lng: 79.8083 },
  moolakulam: { lat: 11.9332, lng: 79.7892 },
  mohannagar: { lat: 11.9385, lng: 79.8010 },
  sulur: { lat: 11.0255, lng: 77.1264 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  tiruppur: { lat: 11.1085, lng: 77.3411 },
  palladam: { lat: 10.9995, lng: 77.2944 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  salem: { lat: 11.6643, lng: 78.1460 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
};

/**
 * Cleans raw address text to generate progressive fallback search candidates
 */
function generateSearchCandidates(rawAddress: string): string[] {
  if (!rawAddress) return [];
  const candidates: string[] = [];

  // Normalize: lowercase, remove special characters and extra spaces
  const clean = rawAddress
    .replace(/[#,/\\-]/g, ' ')
    .replace(/\b(plot|no|door|flat|house|flt|apt|apts|apartment|street|cross|st|rd|road)\b\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Full cleaned address
  if (clean.length > 5) {
    candidates.push(clean);
  }

  // 2. Extract words and look for locality / city segments
  const tokens = clean.split(' ').filter((t) => t.length > 2 && !/^\d+$/.test(t));
  if (tokens.length >= 3) {
    // Last 3 words (usually Locality + City + State)
    candidates.push(tokens.slice(-3).join(', '));
  }
  if (tokens.length >= 2) {
    // Last 2 words (usually Area + City)
    candidates.push(tokens.slice(-2).join(', '));
  }
  if (tokens.length >= 1) {
    // Last word (City)
    candidates.push(tokens[tokens.length - 1]);
  }

  return [...new Set(candidates)];
}

/**
 * Finds known region anchor if geocoding services are blocked or offline
 */
function findKnownRegion(rawAddress: string): { lat: number; lng: number } | null {
  const normalized = rawAddress.toLowerCase().replace(/[^a-z]/g, '');
  for (const [key, coords] of Object.entries(KNOWN_REGION_COORDINATES)) {
    if (normalized.includes(key.replace(/[^a-z]/g, ''))) {
      // Add slight deterministic jitter so distinct addresses in the same city don't completely overlap
      let hash = 0;
      for (let i = 0; i < rawAddress.length; i++) {
        hash = rawAddress.charCodeAt(i) + ((hash << 5) - hash);
      }
      const latJitter = ((Math.abs(hash) % 50) / 5000) - 0.005;
      const lngJitter = (((Math.abs(hash) >> 4) % 50) / 5000) - 0.005;
      return {
        lat: coords.lat + latJitter,
        lng: coords.lng + lngJitter,
      };
    }
  }
  return null;
}

/**
 * Geocodes an address dynamically with progressive fallbacks
 */
export async function geocodeAddressDynamically(
  rawAddress: string,
  fallbackCoords?: { lat: number; lng: number }
): Promise<{ lat: number; lng: number }> {
  if (!rawAddress || !rawAddress.trim()) {
    return fallbackCoords || { lat: 11.9416, lng: 79.8083 };
  }

  const cacheKey = rawAddress.trim().toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  const candidates = generateSearchCandidates(rawAddress);

  // Try OpenStreetMap Nominatim with progressive query cleaning
  for (const query of candidates) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=1&countrycodes=in`;
      
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
          const result = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
          geocodeCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      // Continue to next candidate
    }
  }

  // Tier 3: Match known city / locality anchor from dictionary
  const known = findKnownRegion(rawAddress);
  if (known) {
    geocodeCache.set(cacheKey, known);
    return known;
  }

  // Final fallback
  const finalCoords = fallbackCoords || { lat: 11.9416, lng: 79.8083 };
  geocodeCache.set(cacheKey, finalCoords);
  return finalCoords;
}
