"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentDailySummary = exports.endRide = exports.logLocationPing = exports.startRide = exports.getCurrentRide = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const redis_1 = __importDefault(require("../../config/redis"));
const metrics_1 = require("../../middlewares/metrics");
// Helper to calculate distance between two coordinates in km using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/**
 * GET /api/agent/rides/current
 * Restores active ride upon browser refresh, network reconnection or app reopening.
 */
const getCurrentRide = async (req, res) => {
    try {
        const agentId = req.user?.id;
        if (!agentId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const activeRide = await db_1.default.agentRide.findFirst({
            where: { agentId, status: 'STARTED' },
            include: {
                locations: {
                    orderBy: { timestamp: 'desc' },
                    take: 5,
                },
                tripSegments: {
                    orderBy: { startTime: 'desc' },
                },
            },
            orderBy: { startTime: 'desc' },
        });
        if (!activeRide) {
            return res.status(200).json({ success: true, data: null });
        }
        // Check cached latest ping in Redis for sub-second position
        let latestCached = null;
        try {
            const cachedStr = await redis_1.default.get(`ride:latest:${activeRide.id}`);
            if (cachedStr)
                latestCached = JSON.parse(cachedStr);
        }
        catch { }
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(activeRide.startTime).getTime()) / 1000));
        return res.status(200).json({
            success: true,
            data: {
                ...activeRide,
                elapsedSeconds,
                latestLocation: latestCached || activeRide.locations[0] || null,
            },
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to fetch current ride', 500, error);
    }
};
exports.getCurrentRide = getCurrentRide;
/**
 * POST /api/agent/rides/start
 * Atomically starts a new tracking session for the field agent.
 */
const startRide = async (req, res) => {
    try {
        const agentId = req.user?.id;
        if (!agentId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const agent = await db_1.default.user.findUnique({ where: { id: agentId } });
        if (!agent || !agent.adminId)
            return res.status(400).json({ success: false, message: 'Invalid agent' });
        // Concurrency-safe atomic transaction: close any dangling active rides first
        const [_, newRide] = await db_1.default.$transaction([
            db_1.default.agentRide.updateMany({
                where: { agentId, status: 'STARTED' },
                data: { status: 'COMPLETED', endTime: new Date() },
            }),
            db_1.default.agentRide.create({
                data: {
                    agentId,
                    adminId: agent.adminId,
                    status: 'STARTED',
                },
            }),
        ]);
        // Clean any previous ride keys and prime Redis
        await redis_1.default.del(`ride:anchor:${newRide.id}`);
        await redis_1.default.del(`ride:latest:${newRide.id}`);
        await redis_1.default.set(`ride:data:${newRide.id}`, JSON.stringify(newRide), 'EX', 600);
        return res.status(201).json({ success: true, data: newRide });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to start ride', 500, error);
    }
};
exports.startRide = startRide;
/**
 * POST /api/agent/rides/ping
 * High-precision GPS telemetry logger with anti-fraud filtering and accurate non-lossy distance accumulation.
 */
const logLocationPing = async (req, res) => {
    try {
        const agentId = req.user?.id;
        const { rideId, latitude, longitude, speed, accuracy } = req.body;
        if (!rideId || latitude == null || longitude == null) {
            metrics_1.gpsPingsTotal.labels('rejected').inc();
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }
        const latNum = parseFloat(latitude.toString());
        const lonNum = parseFloat(longitude.toString());
        const speedNum = speed ? Math.max(0, parseFloat(speed.toString())) : 0;
        const accNum = accuracy ? parseFloat(accuracy.toString()) : null;
        // Coordinate integrity validation
        if (isNaN(latNum) || latNum < -90 || latNum > 90 || isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
            metrics_1.gpsPingsTotal.labels('rejected').inc();
            return res.status(400).json({ success: false, message: 'Invalid GPS coordinates' });
        }
        // Verify ride is active
        let rideDataStr = await redis_1.default.get(`ride:data:${rideId}`);
        let ride = null;
        if (rideDataStr) {
            ride = JSON.parse(rideDataStr);
        }
        else {
            ride = await db_1.default.agentRide.findUnique({
                where: { id: rideId },
                include: {
                    agent: { select: { firstName: true, lastName: true } },
                },
            });
            if (ride) {
                await redis_1.default.set(`ride:data:${rideId}`, JSON.stringify(ride), 'EX', 300);
            }
        }
        if (!ride || ride.agentId !== agentId || ride.status !== 'STARTED') {
            metrics_1.gpsPingsTotal.labels('rejected').inc();
            return res.status(403).json({ success: false, message: 'Invalid or inactive ride' });
        }
        metrics_1.gpsPingsTotal.labels('accepted').inc();
        // Accuracy Filter: If accuracy > 100 meters, discard or log as low-confidence noise
        const isLowAccuracy = accNum !== null && accNum > 100;
        // Anchor Distance Accumulator Logic
        // We maintain a dedicated distance anchor coordinate in Redis
        const anchorKey = `ride:anchor:${rideId}`;
        const anchorStr = await redis_1.default.get(anchorKey);
        let anchor = null;
        if (anchorStr) {
            try {
                anchor = JSON.parse(anchorStr);
            }
            catch { }
        }
        let addedDistance = 0;
        let isAnomaly = false;
        let anomalyReason = null;
        if (anchor) {
            const distFromAnchor = calculateDistance(anchor.lat, anchor.lon, latNum, lonNum);
            const timeDeltaSec = Math.max(1, (Date.now() - anchor.timestamp) / 1000);
            const inferredSpeedKmh = (distFromAnchor / (timeDeltaSec / 3600));
            // Anti-Fraud Implausible Jump / Speed Check (> 120 km/h)
            if (timeDeltaSec > 3 && inferredSpeedKmh > 120) {
                isAnomaly = true;
                anomalyReason = `Implausible speed jump (${inferredSpeedKmh.toFixed(1)} km/h)`;
            }
            else if (!isLowAccuracy && distFromAnchor >= 0.015) {
                // Advanced anchor: threshold 15 meters reached!
                addedDistance = distFromAnchor;
                // Advance anchor
                await redis_1.default.set(anchorKey, JSON.stringify({ lat: latNum, lon: lonNum, timestamp: Date.now() }), 'EX', 86400);
            }
        }
        else if (!isLowAccuracy) {
            // First accepted point becomes anchor
            await redis_1.default.set(anchorKey, JSON.stringify({ lat: latNum, lon: lonNum, timestamp: Date.now() }), 'EX', 86400);
        }
        // Cache latest telemetry coordinate for instant sub-second admin map display
        const latestLocData = {
            latitude: latNum,
            longitude: lonNum,
            speed: speedNum,
            accuracy: accNum,
            timestamp: new Date().toISOString(),
            agentName: `${ride.agent?.firstName || ''} ${ride.agent?.lastName || ''}`.trim(),
        };
        await redis_1.default.set(`ride:latest:${rideId}`, JSON.stringify(latestLocData), 'EX', 600);
        let updatedDistance = ride.totalDistance;
        // If anchor advanced or first coordinate, persist to PostgreSQL
        if (addedDistance > 0 || !anchor) {
            updatedDistance = parseFloat((ride.totalDistance + addedDistance).toFixed(3));
            const [_, updatedRideRecord] = await db_1.default.$transaction([
                db_1.default.agentLocation.create({
                    data: {
                        rideId,
                        latitude: latNum,
                        longitude: lonNum,
                        speed: speedNum,
                        accuracy: accNum,
                        isAnomaly,
                        anomalyReason,
                    },
                }),
                db_1.default.agentRide.update({
                    where: { id: rideId },
                    data: {
                        totalDistance: updatedDistance,
                    },
                }),
            ]);
            ride.totalDistance = updatedRideRecord.totalDistance;
            await redis_1.default.set(`ride:data:${rideId}`, JSON.stringify(ride), 'EX', 300);
        }
        return res.status(200).json({
            success: true,
            data: {
                id: rideId,
                status: ride.status,
                totalDistance: updatedDistance,
                latestLocation: latestLocData,
                isAnomaly,
            },
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to log location', 500, error);
    }
};
exports.logLocationPing = logLocationPing;
/**
 * POST /api/agent/rides/end
 * Concludes ride session and finalizes odometer distance.
 */
const endRide = async (req, res) => {
    try {
        const agentId = req.user?.id;
        const { rideId } = req.body;
        const ride = await db_1.default.agentRide.findUnique({ where: { id: rideId } });
        if (!ride || ride.agentId !== agentId) {
            return res.status(403).json({ success: false, message: 'Invalid ride' });
        }
        const updatedRide = await db_1.default.agentRide.update({
            where: { id: rideId },
            data: {
                status: 'COMPLETED',
                endTime: new Date(),
            },
        });
        // Cleanup Redis caches
        await redis_1.default.del(`ride:data:${rideId}`);
        await redis_1.default.del(`ride:latest:${rideId}`);
        await redis_1.default.del(`ride:anchor:${rideId}`);
        return res.status(200).json({ success: true, data: updatedRide });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to end ride', 500, error);
    }
};
exports.endRide = endRide;
/**
 * GET /api/agent/rides/daily-summary
 * Fetches today's odometer travel distance and individual trip legs.
 */
const getAgentDailySummary = async (req, res) => {
    try {
        const agentId = req.user?.id;
        if (!agentId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const dateParam = req.query.date || new Date().toISOString().split('T')[0];
        const startOfDay = new Date(`${dateParam}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateParam}T23:59:59.999Z`);
        const rides = await db_1.default.agentRide.findMany({
            where: {
                agentId,
                createdAt: { gte: startOfDay, lte: endOfDay },
            },
            include: {
                tripSegments: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const totalDistance = parseFloat(rides.reduce((sum, r) => sum + (r.totalDistance || 0), 0).toFixed(2));
        return res.status(200).json({
            success: true,
            data: {
                date: dateParam,
                totalDistance,
                totalRides: rides.length,
                rides,
            },
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to fetch daily summary', 500, error);
    }
};
exports.getAgentDailySummary = getAgentDailySummary;
