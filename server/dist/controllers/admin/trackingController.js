"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceEndRide = exports.getRideHistory = exports.getActiveRides = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const redis_1 = __importDefault(require("../../config/redis"));
const getActiveRides = async (req, res) => {
    try {
        const adminId = req.user?.id;
        // Fetch rides that are STARTED belonging to this admin
        const activeRides = await db_1.default.agentRide.findMany({
            where: {
                adminId,
                status: 'STARTED',
            },
            include: {
                agent: {
                    select: { id: true, firstName: true, lastName: true, phone: true }
                },
                locations: {
                    orderBy: { timestamp: 'desc' },
                    take: 1 // Only get the latest known location
                }
            }
        });
        // Merge in the latest real-time coordinates cached in Redis (sub-second accuracy)
        const activeRidesWithLatest = await Promise.all(activeRides.map(async (ride) => {
            try {
                const latestLocStr = await redis_1.default.get(`ride:latest:${ride.id}`);
                if (latestLocStr) {
                    const cachedLoc = JSON.parse(latestLocStr);
                    ride.locations = [
                        {
                            id: `cached-${ride.id}`,
                            rideId: ride.id,
                            latitude: cachedLoc.latitude,
                            longitude: cachedLoc.longitude,
                            speed: cachedLoc.speed,
                            timestamp: new Date(cachedLoc.timestamp),
                        },
                    ];
                }
            }
            catch (err) {
                // Fail-safe fallback to DB coordinates
            }
            return ride;
        }));
        return res.status(200).json({ success: true, data: activeRidesWithLatest });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to get active rides', 500, error);
    }
};
exports.getActiveRides = getActiveRides;
const getRideHistory = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const rideId = req.params.rideId;
        const ride = await db_1.default.agentRide.findUnique({
            where: { id: rideId },
            include: {
                agent: {
                    select: { id: true, firstName: true, lastName: true }
                },
                locations: {
                    orderBy: { timestamp: 'asc' } // Ascending to draw path correctly
                }
            }
        });
        if (!ride || ride.adminId !== adminId) {
            return res.status(404).json({ success: false, message: 'Ride not found' });
        }
        return res.status(200).json({ success: true, data: ride });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to get ride history', 500, error);
    }
};
exports.getRideHistory = getRideHistory;
const forceEndRide = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const rideId = req.params.rideId;
        const ride = await db_1.default.agentRide.findUnique({ where: { id: rideId } });
        if (!ride || ride.adminId !== adminId) {
            return res.status(404).json({ success: false, message: 'Ride not found' });
        }
        if (ride.status !== 'STARTED') {
            return res.status(400).json({ success: false, message: 'Ride is not active' });
        }
        // Update DB first (fixes race condition)
        await db_1.default.agentRide.update({
            where: { id: rideId },
            data: { status: 'COMPLETED', endTime: new Date() },
        });
        // Then clean Redis
        await redis_1.default.del(`ride:data:${rideId}`);
        await redis_1.default.del(`ride:latest:${rideId}`);
        return res.status(200).json({ success: true, message: 'Ride ended successfully' });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to end ride', 500, error);
    }
};
exports.forceEndRide = forceEndRide;
