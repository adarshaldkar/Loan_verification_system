import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { apiError } from '../../utils/helpers';
import redisClient from '../../config/redis';

// Helper to calculate distance between two coordinates in km using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

export const startRide = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id;
    if (!agentId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    if (!agent || !agent.adminId) return res.status(400).json({ success: false, message: 'Invalid agent' });

    // Close any previous pending rides for this agent
    const activeRides = await prisma.agentRide.findMany({
      where: { agentId, status: 'STARTED' }
    });

    for (const r of activeRides) {
      await redisClient.del(`ride:data:${r.id}`);
      await redisClient.del(`ride:latest:${r.id}`);
    }

    await prisma.agentRide.updateMany({
      where: { agentId, status: 'STARTED' },
      data: { status: 'COMPLETED', endTime: new Date() },
    });

    const newRide = await prisma.agentRide.create({
      data: {
        agentId,
        adminId: agent.adminId,
        status: 'STARTED',
      }
    });

    return res.status(201).json({ success: true, data: newRide });
  } catch (error: any) {
    return apiError(res, 'Failed to start ride', 500, error);
  }
};

export const logLocationPing = async (req: AuthRequest, res: Response) => {
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
    let rideDataStr = await redisClient.get(`ride:data:${rideId}`);
    let ride: any = null;

    if (rideDataStr) {
      ride = JSON.parse(rideDataStr);
    } else {
      ride = await prisma.agentRide.findUnique({
        where: { id: rideId },
        include: {
          agent: { select: { firstName: true, lastName: true } }
        }
      });
      if (ride) {
        await redisClient.set(`ride:data:${rideId}`, JSON.stringify(ride), 'EX', 300); // cache for 5 mins
      }
    }

    if (!ride || ride.agentId !== agentId || ride.status !== 'STARTED') {
      return res.status(403).json({ success: false, message: 'Invalid or inactive ride' });
    }

    // Retrieve last location from Redis to calculate distance
    const lastLocStr = await redisClient.get(redisKey);
    let lastLoc: any = null;
    if (lastLocStr) {
      lastLoc = JSON.parse(lastLocStr);
    }

    let addedDistance = 0;
    if (lastLoc) {
      addedDistance = calculateDistance(lastLoc.latitude, lastLoc.longitude, latNum, lonNum);
    } else {
      // If not in Redis, try checking the database for the last location
      const dbLastLoc = await prisma.agentLocation.findFirst({
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
    await redisClient.set(redisKey, JSON.stringify(newLocData), 'EX', 600);

    // DB Write Optimization: Only write to PostgreSQL if agent has moved at least 10 meters (0.01 km) or if there was no last location
    let updatedRideDistance = ride.totalDistance;
    if (!lastLoc || addedDistance >= 0.01) {
      // Insert to DB and update total distance
      const [newLocation, updatedRide] = await prisma.$transaction([
        prisma.agentLocation.create({
          data: {
            rideId,
            latitude: latNum,
            longitude: lonNum,
            speed: speedNum,
          }
        }),
        prisma.agentRide.update({
          where: { id: rideId },
          data: { totalDistance: { increment: addedDistance } }
        })
      ]);
      updatedRideDistance = updatedRide.totalDistance;

      // Update cached ride details with new distance
      ride.totalDistance = updatedRide.totalDistance;
      await redisClient.set(`ride:data:${rideId}`, JSON.stringify(ride), 'EX', 300);
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
  } catch (error: any) {
    return apiError(res, 'Failed to log location', 500, error);
  }
};

export const endRide = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id;
    const { rideId } = req.body;

    const ride = await prisma.agentRide.findUnique({ where: { id: rideId } });
    if (!ride || ride.agentId !== agentId) {
      return res.status(403).json({ success: false, message: 'Invalid ride' });
    }

    // Clean up Redis Cache keys
    await redisClient.del(`ride:data:${rideId}`);
    await redisClient.del(`ride:latest:${rideId}`);

    const updatedRide = await prisma.agentRide.update({
      where: { id: rideId },
      data: { status: 'COMPLETED', endTime: new Date() }
    });

    return res.status(200).json({ success: true, data: updatedRide });
  } catch (error: any) {
    return apiError(res, 'Failed to end ride', 500, error);
  }
};
