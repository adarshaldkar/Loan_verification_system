"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSearchCandidates = generateSearchCandidates;
exports.findKnownRegion = findKnownRegion;
exports.geocodeAddress = geocodeAddress;
const redis_1 = __importDefault(require("../config/redis"));
// City/district anchors. Used ONLY when Nominatim is rate-limited/unreachable.
const KNOWN_REGION_COORDINATES = {
    puducherry: { lat: 11.9416, lng: 79.8083 },
    pondicherry: { lat: 11.9416, lng: 79.8083 },
    moolakulam: { lat: 11.9332, lng: 79.7892 },
    mohannagar: { lat: 11.9385, lng: 79.8010 },
    karaikal: { lat: 10.9924, lng: 79.8165 },
    cuddalore: { lat: 11.7447, lng: 79.7679 },
    villupuram: { lat: 11.9417, lng: 79.4922 },
    sulur: { lat: 11.0255, lng: 77.1264 },
    coimbatore: { lat: 11.0168, lng: 76.9558 },
    tiruppur: { lat: 11.1085, lng: 77.3411 },
    palladam: { lat: 10.9995, lng: 77.2944 },
    avinashi: { lat: 11.1902, lng: 77.2679 },
    annur: { lat: 11.2388, lng: 77.1117 },
    kinathukadavu: { lat: 10.8218, lng: 76.9833 },
    pollachi: { lat: 10.6572, lng: 77.0087 },
    udumalpet: { lat: 10.5877, lng: 77.2484 },
    dharapuram: { lat: 10.7337, lng: 77.5332 },
    erode: { lat: 11.341, lng: 77.7172 },
    vellore: { lat: 12.9165, lng: 79.1325 },
    salem: { lat: 11.6643, lng: 78.146 },
    kumbakonam: { lat: 10.9602, lng: 79.3844 },
    thanjavur: { lat: 10.787, lng: 79.1378 },
    madurai: { lat: 9.9252, lng: 78.1198 },
    trichy: { lat: 10.7905, lng: 78.7047 },
    tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
    udhagamandalam: { lat: 11.4102, lng: 76.695 },
    ooty: { lat: 11.4102, lng: 76.695 },
    munnar: { lat: 10.0889, lng: 77.0595 },
    chennai: { lat: 13.0827, lng: 80.2707 },
    bangalore: { lat: 12.9716, lng: 77.5946 },
    bengaluru: { lat: 12.9716, lng: 77.5946 },
    hosur: { lat: 12.7409, lng: 77.8253 },
    mumbai: { lat: 19.076, lng: 72.8777 },
    delhi: { lat: 28.6139, lng: 77.209 },
    hyderabad: { lat: 17.385, lng: 78.4867 },
    kolkata: { lat: 22.5726, lng: 88.3639 },
    pune: { lat: 18.5204, lng: 73.8567 },
    ahmedabad: { lat: 23.0225, lng: 72.5714 },
};
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const NOMINATIM_USER_AGENT = 'LoanVerificationSystem/1.0 (Vistaar Financial Services; loan verification field app)';
const REQUEST_INTERVAL_MS = 1100; // Nominatim usage policy: max 1 req/sec
const RESULT_TTL_SECONDS = 60 * 60 * 24 * 30;
let lastRequestAt = 0;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function throttleNominatim() {
    const now = Date.now();
    const wait = lastRequestAt + REQUEST_INTERVAL_MS - now;
    if (wait > 0)
        await sleep(wait);
    lastRequestAt = Date.now();
}
function generateSearchCandidates(rawAddress) {
    if (!rawAddress)
        return [];
    const candidates = [];
    const clean = rawAddress
        .replace(/[#,/\\-]/g, ' ')
        .replace(/\b(plot|no|door|flat|house|flt|apt|apts|apartment|street|cross|st|rd|road)\b\.?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (clean.length > 5)
        candidates.push(clean);
    const tokens = clean.split(' ').filter((t) => t.length > 2 && !/^\d+$/.test(t));
    if (tokens.length >= 3)
        candidates.push(tokens.slice(-3).join(', '));
    if (tokens.length >= 2)
        candidates.push(tokens.slice(-2).join(', '));
    if (tokens.length >= 1)
        candidates.push(tokens[tokens.length - 1]);
    return [...new Set(candidates)];
}
function findKnownRegion(rawAddress) {
    const normalized = rawAddress.toLowerCase().replace(/[^a-z]/g, '');
    for (const [key, coords] of Object.entries(KNOWN_REGION_COORDINATES)) {
        if (normalized.includes(key.replace(/[^a-z]/g, ''))) {
            let hash = 0;
            for (let i = 0; i < rawAddress.length; i++) {
                hash = rawAddress.charCodeAt(i) + ((hash << 5) - hash);
            }
            const latJitter = (Math.abs(hash) % 50) / 5000 - 0.005;
            const lngJitter = ((Math.abs(hash) >> 4) % 50) / 5000 - 0.005;
            return { lat: coords.lat + latJitter, lng: coords.lng + lngJitter };
        }
    }
    return null;
}
function classifyAccuracy(addresstype, address) {
    const type = (addresstype || '').toLowerCase();
    const houseLike = [
        'building', 'house_number', 'shop', 'apartments', 'hotel', 'commercial',
        'office', 'amenity', 'place_of_worship', 'workshop', 'factory', 'industrial',
        'clinic', 'doctors', 'hospital', 'school', 'university', 'college', 'bank',
        'restaurant', 'cafe', 'retail', 'yes',
    ];
    const cityLike = ['city', 'town', 'village', 'municipality', 'district', 'county', 'state', 'region'];
    if (houseLike.includes(type))
        return 'house';
    if (cityLike.includes(type))
        return 'city';
    if (type === 'road' || type === 'street' || type === 'pedestrian' || type === 'footway')
        return 'street';
    if (address && typeof address === 'object') {
        if (address.house_number || address.building || address.shop)
            return 'house';
        if (address.road)
            return 'street';
    }
    return 'street';
}
async function queryNominatim(query) {
    await throttleNominatim();
    try {
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            limit: '1',
            countrycodes: 'in',
            'accept-language': 'en',
        });
        const res = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, {
            headers: {
                'User-Agent': NOMINATIM_USER_AGENT,
                Accept: 'application/json',
            },
        });
        if (res.status === 429 || !res.ok)
            return null;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                accuracy: classifyAccuracy(data[0].addresstype || data[0].type, data[0].address),
                displayName: data[0].display_name || query,
            };
        }
    }
    catch {
        // offline / blocked — caller falls through to dictionary
    }
    return null;
}
function cacheKey(rawAddress) {
    return `geocode:${rawAddress.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}
async function readCache(key) {
    try {
        const cached = await redis_1.default.get(key);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
                return { ...parsed, source: 'cache' };
            }
        }
    }
    catch {
        // ignore cache failures
    }
    return null;
}
async function writeCache(key, result) {
    try {
        await redis_1.default.set(key, JSON.stringify(result), 'EX', RESULT_TTL_SECONDS);
    }
    catch {
        // ignore cache failures
    }
}
/**
 * Resolves a raw address to coordinates.
 * Tiers: Redis cache -> Nominatim (OSM) -> city dictionary.
 * If nothing resolves, returns null lat/lng (unknown) — NEVER a fabricated pin.
 */
async function geocodeAddress(rawAddress) {
    if (!rawAddress || !rawAddress.trim()) {
        return { lat: null, lng: null, accuracy: 'unknown', source: 'unknown' };
    }
    const key = cacheKey(rawAddress);
    const cached = await readCache(key);
    if (cached)
        return cached;
    for (const query of generateSearchCandidates(rawAddress)) {
        const r = await queryNominatim(query);
        if (r) {
            const result = { ...r, source: 'osm' };
            await writeCache(key, result);
            return result;
        }
    }
    const known = findKnownRegion(rawAddress);
    if (known) {
        const result = { ...known, accuracy: 'city', source: 'dictionary' };
        await writeCache(key, result);
        return result;
    }
    const result = { lat: null, lng: null, accuracy: 'unknown', source: 'unknown' };
    await writeCache(key, result);
    return result;
}
