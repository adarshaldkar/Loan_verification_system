import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { apiError } from '../../utils/helpers';
import redisClient from '../../config/redis';

export const getActiveRides = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    
    // Fetch rides that are STARTED belonging to this admin
    const activeRides = await prisma.agentRide.findMany({
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
    const activeRidesWithLatest = await Promise.all(
      activeRides.map(async (ride) => {
        try {
          const latestLocStr = await redisClient.get(`ride:latest:${ride.id}`);
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
        } catch (err) {
          // Fail-safe fallback to DB coordinates
        }
        return ride;
      })
    );

    return res.status(200).json({ success: true, data: activeRidesWithLatest });
  } catch (error: any) {
    return apiError(res, 'Failed to get active rides', 500, error);
  }
};

export const getRideHistory = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const rideId = req.params.rideId as string;

    const ride = await prisma.agentRide.findUnique({
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
  } catch (error: any) {
    return apiError(res, 'Failed to get ride history', 500, error);
  }
};

export const forceEndRide = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { rideId } = req.params;

    const ride = await prisma.agentRide.findUnique({ where: { id: rideId } });
    if (!ride || ride.adminId !== adminId) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    if (ride.status !== 'STARTED') {
      return res.status(400).json({ success: false, message: 'Ride is not active' });
    }

    // Update DB first (fixes race condition)
    await prisma.agentRide.update({
      where: { id: rideId },
      data: { status: 'COMPLETED', endTime: new Date() },
    });

    // Then clean Redis
    await redisClient.del(`ride:data:${rideId}`);
    await redisClient.del(`ride:latest:${rideId}`);

    return res.status(200).json({ success: true, message: 'Ride ended successfully' });
  } catch (error: any) {
    return apiError(res, 'Failed to end ride', 500, error);
  }
};
