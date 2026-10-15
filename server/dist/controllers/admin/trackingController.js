"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceEndRide = exports.getRideHistory = exports.getActiveRides = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const redis_1 = __importDefault(require("../../config/redis"));
/**
 * GET /api/admin/tracking/active
 * Real-time map telemetry for all active field agents with Swiggy/Rapido style movement states.
 */
const getActiveRides = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
        const whereClause = { status: 'STARTED' };
        if (!isSuperAdmin) {
            whereClause.adminId = adminId;
        }
        // Fetch active rides with recent 10 location breadcrumbs for drawing the live trail
        const activeRides = await db_1.default.agentRide.findMany({
            where: whereClause,
            include: {
                agent: {
                    select: { id: true, firstName: true, lastName: true, phone: true, branch: true },
                },
                locations: {
                    orderBy: { timestamp: 'desc' },
                    take: 10,
                },
            },
            orderBy: { startTime: 'desc' },
        });
        // Deduplicate rides per agent
        const agentSeen = new Set();
        const deduplicatedRides = [];
        for (const ride of activeRides) {
            if (!agentSeen.has(ride.agentId)) {
                agentSeen.add(ride.agentId);
                deduplicatedRides.push(ride);
            }
        }
        // Enhance each ride with live telemetry and movement states
        const now = Date.now();
        const enrichedRides = await Promise.all(deduplicatedRides.map(async (ride) => {
            let latestLoc = ride.locations[0] || null;
            // Try getting latest sub-second coordinate from Redis
            try {
                const cachedStr = await redis_1.default.get(`ride:latest:${ride.id}`);
                if (cachedStr) {
                    const cached = JSON.parse(cachedStr);
                    latestLoc = {
                        id: `cached-${ride.id}`,
                        rideId: ride.id,
                        latitude: cached.latitude,
                        longitude: cached.longitude,
                        speed: cached.speed || 0,
                        accuracy: cached.accuracy || null,
                        timestamp: new Date(cached.timestamp),
                    };
                    // Prepend to locations trail if not identical
                    if (!ride.locations.length || Math.abs(ride.locations[0].latitude - cached.latitude) > 0.0001) {
                        ride.locations.unshift(latestLoc);
                    }
                }
            }
            catch { }
            // Movement State Classification
            let movementStatus = 'IDLE';
            let secondsAgo = 9999;
            if (latestLoc) {
                const pingTime = new Date(latestLoc.timestamp).getTime();
                secondsAgo = Math.max(0, Math.floor((now - pingTime) / 1000));
                const speedKmh = (latestLoc.speed || 0) * 3.6;
                if (secondsAgo <= 60 && speedKmh >= 4.0) {
                    movementStatus = 'MOVING';
                }
                else if (secondsAgo <= 180) {
                    movementStatus = 'ON_SITE';
                }
                else {
                    movementStatus = 'IDLE';
                }
            }
            return {
                ...ride,
                movementStatus,
                secondsAgo,
                latestLocation: latestLoc,
                recentTrail: ride.locations.map((l) => ({
                    lat: l.latitude,
                    lng: l.longitude,
                    speed: l.speed,
                    time: l.timestamp,
                })),
            };
        }));
        return res.status(200).json({ success: true, data: enrichedRides });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to get active rides', 500, error);
    }
};
exports.getActiveRides = getActiveRides;
/**
 * GET /api/admin/tracking/history/:rideId
 * Retrieves full path history and trip segments for playback.
 */
const getRideHistory = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
        const rideId = req.params.rideId;
        const ride = await db_1.default.agentRide.findUnique({
            where: { id: rideId },
            include: {
                agent: {
                    select: { id: true, firstName: true, lastName: true, phone: true, branch: true },
                },
                locations: {
                    orderBy: { timestamp: 'asc' }, // Path in chronological order
                },
                tripSegments: true,
            },
        });
        if (!ride || (!isSuperAdmin && ride.adminId !== adminId)) {
            return res.status(404).json({ success: false, message: 'Ride not found' });
        }
        return res.status(200).json({ success: true, data: ride });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to get ride history', 500, error);
    }
};
exports.getRideHistory = getRideHistory;
/**
 * POST /api/admin/tracking/force-end/:rideId
 * Emergency stop for an active ride.
 */
const forceEndRide = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
        const rideId = req.params.rideId;
        const ride = await db_1.default.agentRide.findUnique({ where: { id: rideId } });
        if (!ride || (!isSuperAdmin && ride.adminId !== adminId)) {
            return res.status(404).json({ success: false, message: 'Ride not found' });
        }
        if (ride.status !== 'STARTED') {
            return res.status(400).json({ success: false, message: 'Ride is not active' });
        }
        await db_1.default.agentRide.update({
            where: { id: rideId },
            data: {
                status: 'COMPLETED',
                endTime: new Date(),
            },
        });
        await redis_1.default.del(`ride:data:${rideId}`);
        await redis_1.default.del(`ride:latest:${rideId}`);
        await redis_1.default.del(`ride:anchor:${rideId}`);
        return res.status(200).json({ success: true, message: 'Ride ended successfully' });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to end ride', 500, error);
    }
};
exports.forceEndRide = forceEndRide;
