"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endRide = exports.logLocationPing = exports.startRide = void 0;
const db_1 = __importDefault(require("../../config/db"));
const helpers_1 = require("../../utils/helpers");
const redis_1 = __importDefault(require("../../config/redis"));
// Helper to calculate distance between two coordinates in km using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
const startRide = async (req, res) => {
    try {
        const agentId = req.user?.id;
        if (!agentId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const agent = await db_1.default.user.findUnique({ where: { id: agentId } });
        if (!agent || !agent.adminId)
            return res.status(400).json({ success: false, message: 'Invalid agent' });
        // Close any previous pending rides for this agent
        const activeRides = await db_1.default.agentRide.findMany({
            where: { agentId, status: 'STARTED' }
        });
        for (const r of activeRides) {
            await redis_1.default.del(`ride:data:${r.id}`);
            await redis_1.default.del(`ride:latest:${r.id}`);
        }
        await db_1.default.agentRide.updateMany({
            where: { agentId, status: 'STARTED' },
            data: { status: 'COMPLETED', endTime: new Date() },
        });
        const newRide = await db_1.default.agentRide.create({
            data: {
                agentId,
                adminId: agent.adminId,
                status: 'STARTED',
            }
        });
        return res.status(201).json({ success: true, data: newRide });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to start ride', 500, error);
    }
};
exports.startRide = startRide;
const logLocationPing = async (req, res) => {
    try {
        const agentId = req.user?.id;
        const { rideId, latitude, longitude, speed } = req.body;
        if (!rideId || latitude == null || longitude == null) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }
        const latNum = parseFloat(latitude.toString());
        const lonNum = parseFloat(longitude.toString());
        const speedNum = speed ? parseFloat(speed.toString()) : 0;
        // Cache key for the latest location of this active ride
        const redisKey = `ride:latest:${rideId}`;
        // Verify ride from Redis cache first! If not found, load from DB and cache
        let rideDataStr = await redis_1.default.get(`ride:data:${rideId}`);
        let ride = null;
        if (rideDataStr) {
            ride = JSON.parse(rideDataStr);
        }
        else {
            ride = await db_1.default.agentRide.findUnique({
                where: { id: rideId },
                include: {
                    agent: { select: { firstName: true, lastName: true } }
                }
            });
            if (ride) {
                await redis_1.default.set(`ride:data:${rideId}`, JSON.stringify(ride), 'EX', 300); // cache for 5 mins
            }
        }
        if (!ride || ride.agentId !== agentId || ride.status !== 'STARTED') {
            return res.status(403).json({ success: false, message: 'Invalid or inactive ride' });
        }
        // Retrieve last location from Redis to calculate distance
        const lastLocStr = await redis_1.default.get(redisKey);
        let lastLoc = null;
        if (lastLocStr) {
            lastLoc = JSON.parse(lastLocStr);
        }
        let addedDistance = 0;
        if (lastLoc) {
            addedDistance = calculateDistance(lastLoc.latitude, lastLoc.longitude, latNum, lonNum);
        }
        else {
            // If not in Redis, try checking the database for the last location
            const dbLastLoc = await db_1.default.agentLocation.findFirst({
                where: { rideId },
                orderBy: { timestamp: 'desc' }
            });
            if (dbLastLoc) {
                addedDistance = calculateDistance(dbLastLoc.latitude, dbLastLoc.longitude, latNum, lonNum);
            }
        }
        // Cache the latest location to Redis instantly (expiring in 10 minutes)
        const newLocData = {
            latitude: latNum,
            longitude: lonNum,
            speed: speedNum,
            timestamp: new Date().toISOString(),
            agentName: `${ride.agent?.firstName || ''} ${ride.agent?.lastName || ''}`.trim()
        };
        await redis_1.default.set(redisKey, JSON.stringify(newLocData), 'EX', 600);
        // DB Write Optimization: Only write to PostgreSQL if agent has moved at least 10 meters (0.01 km) or if there was no last location
        let updatedRideDistance = ride.totalDistance;
        if (!lastLoc || addedDistance >= 0.01) {
            // Insert to DB and update total distance
            const [newLocation, updatedRide] = await db_1.default.$transaction([
                db_1.default.agentLocation.create({
                    data: {
                        rideId,
                        latitude: latNum,
                        longitude: lonNum,
                        speed: speedNum,
                    }
                }),
                db_1.default.agentRide.update({
                    where: { id: rideId },
                    data: { totalDistance: { increment: addedDistance } }
                })
            ]);
            updatedRideDistance = updatedRide.totalDistance;
            // Update cached ride details with new distance
            ride.totalDistance = updatedRide.totalDistance;
            await redis_1.default.set(`ride:data:${rideId}`, JSON.stringify(ride), 'EX', 300);
        }
        return res.status(200).json({
            success: true,
            data: {
                id: rideId,
                status: ride.status,
                totalDistance: updatedRideDistance,
                latestLocation: newLocData
            }
        });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to log location', 500, error);
    }
};
exports.logLocationPing = logLocationPing;
const endRide = async (req, res) => {
    try {
        const agentId = req.user?.id;
        const { rideId } = req.body;
        const ride = await db_1.default.agentRide.findUnique({ where: { id: rideId } });
        if (!ride || ride.agentId !== agentId) {
            return res.status(403).json({ success: false, message: 'Invalid ride' });
        }
        // Clean up Redis Cache keys
        await redis_1.default.del(`ride:data:${rideId}`);
        await redis_1.default.del(`ride:latest:${rideId}`);
        const updatedRide = await db_1.default.agentRide.update({
            where: { id: rideId },
            data: { status: 'COMPLETED', endTime: new Date() }
        });
        return res.status(200).json({ success: true, data: updatedRide });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to end ride', 500, error);
    }
};
exports.endRide = endRide;
