import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { apiError } from '../../utils/helpers';
import redisClient from '../../config/redis';
import { gpsPingsTotal } from '../../middlewares/metrics';

// Helper to calculate distance between two coordinates in km using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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
export const getCurrentRide = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id;
    if (!agentId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const activeRide = await prisma.agentRide.findFirst({
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
      const cachedStr = await redisClient.get(`ride:latest:${activeRide.id}`);
      if (cachedStr) latestCached = JSON.parse(cachedStr);
    } catch {}

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(activeRide.startTime).getTime()) / 1000)
    );

    return res.status(200).json({
      success: true,
      data: {
        ...activeRide,
        elapsedSeconds,
        latestLocation: latestCached || activeRide.locations[0] || null,
      },
    });
  } catch (error: any) {
    return apiError(res, 'Failed to fetch current ride', 500, error);
  }
};

/**
 * POST /api/agent/rides/start
 * Atomically starts a new tracking session with the company-configured fuel rate.
 */
export const startRide = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id;
    if (!agentId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    if (!agent || !agent.adminId) return res.status(400).json({ success: false, message: 'Invalid agent' });

    // Look up company-approved fuel rate per km
    let fuelRatePerKm = 3.5;
    try {
      const settings = await prisma.systemSetting.findFirst({
        where: { adminId: agent.adminId },
      });
      if (settings?.fuelRatePerKm && settings.fuelRatePerKm > 0) {
        fuelRatePerKm = settings.fuelRatePerKm;
      }
    } catch {}

    // Concurrency-safe atomic transaction: close any dangling active rides first
    const [_, newRide] = await prisma.$transaction([
      prisma.agentRide.updateMany({
        where: { agentId, status: 'STARTED' },
        data: { status: 'COMPLETED', endTime: new Date() },
      }),
      prisma.agentRide.create({
        data: {
          agentId,
          adminId: agent.adminId,
          status: 'STARTED',
          fuelRatePerKm,
          fuelCost: 0,
        },
      }),
    ]);

    // Clean any previous ride keys and prime Redis
    await redisClient.del(`ride:anchor:${newRide.id}`);
    await redisClient.del(`ride:latest:${newRide.id}`);
    await redisClient.set(`ride:data:${newRide.id}`, JSON.stringify(newRide), 'EX', 600);

    return res.status(201).json({ success: true, data: newRide });
  } catch (error: any) {
    return apiError(res, 'Failed to start ride', 500, error);
  }
};

/**
 * POST /api/agent/rides/ping
 * High-precision GPS telemetry logger with anti-fraud filtering and accurate non-lossy distance accumulation.
 */
export const logLocationPing = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id;
    const { rideId, latitude, longitude, speed, accuracy } = req.body;

    if (!rideId || latitude == null || longitude == null) {
      gpsPingsTotal.labels('rejected').inc();
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    const latNum = parseFloat(latitude.toString());
    const lonNum = parseFloat(longitude.toString());
    const speedNum = speed ? Math.max(0, parseFloat(speed.toString())) : 0;
    const accNum = accuracy ? parseFloat(accuracy.toString()) : null;

    // Coordinate integrity validation
    if (isNaN(latNum) || latNum < -90 || latNum > 90 || isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      gpsPingsTotal.labels('rejected').inc();
      return res.status(400).json({ success: false, message: 'Invalid GPS coordinates' });
    }

    // Verify ride is active
    let rideDataStr = await redisClient.get(`ride:data:${rideId}`);
    let ride: any = null;

    if (rideDataStr) {
      ride = JSON.parse(rideDataStr);
    } else {
      ride = await prisma.agentRide.findUnique({
        where: { id: rideId },
        include: {
          agent: { select: { firstName: true, lastName: true } },
        },
      });
      if (ride) {
        await redisClient.set(`ride:data:${rideId}`, JSON.stringify(ride), 'EX', 300);
      }
    }

    if (!ride || ride.agentId !== agentId || ride.status !== 'STARTED') {
      gpsPingsTotal.labels('rejected').inc();
      return res.status(403).json({ success: false, message: 'Invalid or inactive ride' });
    }

    gpsPingsTotal.labels('accepted').inc();

    // Accuracy Filter: If accuracy > 100 meters, discard or log as low-confidence noise
    const isLowAccuracy = accNum !== null && accNum > 100;

    // Anchor Distance Accumulator Logic
    // We maintain a dedicated distance anchor coordinate in Redis
    const anchorKey = `ride:anchor:${rideId}`;
    const anchorStr = await redisClient.get(anchorKey);
    let anchor: { lat: number; lon: number; timestamp: number } | null = null;
    if (anchorStr) {
      try {
        anchor = JSON.parse(anchorStr);
      } catch {}
    }

    let addedDistance = 0;
    let isAnomaly = false;
    let anomalyReason: string | null = null;

    if (anchor) {
      const distFromAnchor = calculateDistance(anchor.lat, anchor.lon, latNum, lonNum);
      const timeDeltaSec = Math.max(1, (Date.now() - anchor.timestamp) / 1000);
      const inferredSpeedKmh = (distFromAnchor / (timeDeltaSec / 3600));

      // Anti-Fraud Implausible Jump / Speed Check (> 120 km/h)
      if (timeDeltaSec > 3 && inferredSpeedKmh > 120) {
        isAnomaly = true;
        anomalyReason = `Implausible speed jump (${inferredSpeedKmh.toFixed(1)} km/h)`;
      } else if (!isLowAccuracy && distFromAnchor >= 0.015) {
        // Advanced anchor: threshold 15 meters reached!
        addedDistance = distFromAnchor;
        // Advance anchor
        await redisClient.set(
          anchorKey,
          JSON.stringify({ lat: latNum, lon: lonNum, timestamp: Date.now() }),
          'EX',
          86400
        );
      }
    } else if (!isLowAccuracy) {
      // First accepted point becomes anchor
      await redisClient.set(
        anchorKey,
        JSON.stringify({ lat: latNum, lon: lonNum, timestamp: Date.now() }),
        'EX',
        86400
      );
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
    await redisClient.set(`ride:latest:${rideId}`, JSON.stringify(latestLocData), 'EX', 600);

    let updatedDistance = ride.totalDistance;
    let updatedFuelCost = ride.fuelCost || 0;
    const fuelRate = ride.fuelRatePerKm || 3.5;

    // If anchor advanced or first coordinate, persist to PostgreSQL
    if (addedDistance > 0 || !anchor) {
      updatedDistance = parseFloat((ride.totalDistance + addedDistance).toFixed(3));
      updatedFuelCost = parseFloat((updatedDistance * fuelRate).toFixed(2));

      const [_, updatedRideRecord] = await prisma.$transaction([
        prisma.agentLocation.create({
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
        prisma.agentRide.update({
          where: { id: rideId },
          data: {
            totalDistance: updatedDistance,
            fuelCost: updatedFuelCost,
          },
        }),
      ]);

      ride.totalDistance = updatedRideRecord.totalDistance;
      ride.fuelCost = updatedRideRecord.fuelCost;
      await redisClient.set(`ride:data:${rideId}`, JSON.stringify(ride), 'EX', 300);
    }

    return res.status(200).json({
      success: true,
      data: {
        id: rideId,
        status: ride.status,
        totalDistance: updatedDistance,
        fuelCost: updatedFuelCost,
        fuelRatePerKm: fuelRate,
        latestLocation: latestLocData,
        isAnomaly,
      },
    });
  } catch (error: any) {
    return apiError(res, 'Failed to log location', 500, error);
  }
};

/**
 * POST /api/agent/rides/end
 * Concludes ride session and finalizes fuel reimbursement claim.
 */
export const endRide = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id;
    const { rideId } = req.body;

    const ride = await prisma.agentRide.findUnique({ where: { id: rideId } });
    if (!ride || ride.agentId !== agentId) {
      return res.status(403).json({ success: false, message: 'Invalid ride' });
    }

    const finalFuelCost = parseFloat(((ride.totalDistance || 0) * (ride.fuelRatePerKm || 3.5)).toFixed(2));

    const updatedRide = await prisma.agentRide.update({
      where: { id: rideId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        fuelCost: finalFuelCost,
        claimedAmount: finalFuelCost,
        reimbursementStatus: 'PENDING',
      },
    });

    // Cleanup Redis caches
    await redisClient.del(`ride:data:${rideId}`);
    await redisClient.del(`ride:latest:${rideId}`);
    await redisClient.del(`ride:anchor:${rideId}`);

    return res.status(200).json({ success: true, data: updatedRide });
  } catch (error: any) {
    return apiError(res, 'Failed to end ride', 500, error);
  }
};

/**
 * GET /api/agent/rides/daily-summary
 * Fetches today's odometer travel, fuel expense allowance, and individual legs.
 */
export const getAgentDailySummary = async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.id;
    if (!agentId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const dateParam = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${dateParam}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateParam}T23:59:59.999Z`);

    const rides = await prisma.agentRide.findMany({
      where: {
        agentId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        tripSegments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalDistance = parseFloat(
      rides.reduce((sum, r) => sum + (r.totalDistance || 0), 0).toFixed(2)
    );
    const totalFuelCost = parseFloat(
      rides.reduce((sum, r) => sum + (r.fuelCost || 0), 0).toFixed(2)
    );

    return res.status(200).json({
      success: true,
      data: {
        date: dateParam,
        totalDistance,
        totalFuelCost,
        totalRides: rides.length,
        rides,
      },
    });
  } catch (error: any) {
    return apiError(res, 'Failed to fetch daily summary', 500, error);
  }
};
