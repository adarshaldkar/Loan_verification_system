import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { apiError } from '../../utils/helpers';
import redisClient from '../../config/redis';

/**
 * GET /api/admin/tracking/active
 * Real-time map telemetry for all active field agents with Swiggy/Rapido style movement states.
 */
export const getActiveRides = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    const whereClause: any = { status: 'STARTED' };
    if (!isSuperAdmin) {
      whereClause.adminId = adminId;
    }

    // Fetch active rides with recent 10 location breadcrumbs for drawing the live trail
    const activeRides = await prisma.agentRide.findMany({
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
    const agentSeen = new Set<string>();
    const deduplicatedRides: any[] = [];

    for (const ride of activeRides) {
      if (!agentSeen.has(ride.agentId)) {
        agentSeen.add(ride.agentId);
        deduplicatedRides.push(ride);
      }
    }

    // Enhance each ride with live telemetry and movement states
    const now = Date.now();
    const enrichedRides = await Promise.all(
      deduplicatedRides.map(async (ride) => {
        let latestLoc = ride.locations[0] || null;

        // Try getting latest sub-second coordinate from Redis
        try {
          const cachedStr = await redisClient.get(`ride:latest:${ride.id}`);
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
              ride.locations.unshift(latestLoc as any);
            }
          }
        } catch {}

        // Movement State Classification
        let movementStatus: 'MOVING' | 'ON_SITE' | 'IDLE' = 'IDLE';
        let secondsAgo = 9999;

        if (latestLoc) {
          const pingTime = new Date(latestLoc.timestamp).getTime();
          secondsAgo = Math.max(0, Math.floor((now - pingTime) / 1000));
          const speedKmh = (latestLoc.speed || 0) * 3.6;

          if (secondsAgo <= 60 && speedKmh >= 4.0) {
            movementStatus = 'MOVING';
          } else if (secondsAgo <= 180) {
            movementStatus = 'ON_SITE';
          } else {
            movementStatus = 'IDLE';
          }
        }

        const fuelRate = ride.fuelRatePerKm || 3.5;
        const currentFuelCost = parseFloat(((ride.totalDistance || 0) * fuelRate).toFixed(2));

        return {
          ...ride,
          movementStatus,
          secondsAgo,
          fuelCost: currentFuelCost,
          latestLocation: latestLoc,
          recentTrail: ride.locations.map((l: any) => ({
            lat: l.latitude,
            lng: l.longitude,
            speed: l.speed,
            time: l.timestamp,
          })),
        };
      })
    );

    return res.status(200).json({ success: true, data: enrichedRides });
  } catch (error: any) {
    return apiError(res, 'Failed to get active rides', 500, error);
  }
};

/**
 * GET /api/admin/tracking/history/:rideId
 * Retrieves full path history and trip segments for playback.
 */
export const getRideHistory = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const rideId = req.params.rideId as string;

    const ride = await prisma.agentRide.findUnique({
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
  } catch (error: any) {
    return apiError(res, 'Failed to get ride history', 500, error);
  }
};

/**
 * POST /api/admin/tracking/force-end/:rideId
 * Emergency stop for an active ride.
 */
export const forceEndRide = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const rideId = req.params.rideId as string;

    const ride = await prisma.agentRide.findUnique({ where: { id: rideId } });
    if (!ride || (!isSuperAdmin && ride.adminId !== adminId)) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    if (ride.status !== 'STARTED') {
      return res.status(400).json({ success: false, message: 'Ride is not active' });
    }

    const finalFuelCost = parseFloat(((ride.totalDistance || 0) * (ride.fuelRatePerKm || 3.5)).toFixed(2));

    await prisma.agentRide.update({
      where: { id: rideId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        fuelCost: finalFuelCost,
        claimedAmount: finalFuelCost,
      },
    });

    await redisClient.del(`ride:data:${rideId}`);
    await redisClient.del(`ride:latest:${rideId}`);
    await redisClient.del(`ride:anchor:${rideId}`);

    return res.status(200).json({ success: true, message: 'Ride ended successfully' });
  } catch (error: any) {
    return apiError(res, 'Failed to end ride', 500, error);
  }
};

/**
 * GET /api/admin/tracking/reimbursements
 * Table listing of fuel reimbursement claims with date, agent, and approval filters.
 */
export const getReimbursementClaims = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const status = req.query.status as string | undefined;
    const agentId = req.query.agentId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const where: any = {};
    if (!isSuperAdmin) where.adminId = adminId;
    if (status && status !== 'ALL') where.reimbursementStatus = status;
    if (agentId) where.agentId = agentId;

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }

    const claims = await prisma.agentRide.findMany({
      where,
      include: {
        agent: {
          select: { id: true, firstName: true, lastName: true, phone: true, branch: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const summary = {
      totalDistance: parseFloat(claims.reduce((s, c) => s + (c.totalDistance || 0), 0).toFixed(2)),
      totalClaimed: parseFloat(claims.reduce((s, c) => s + (c.claimedAmount || c.fuelCost || 0), 0).toFixed(2)),
      totalApproved: parseFloat(claims.reduce((s, c) => s + (c.approvedAmount || 0), 0).toFixed(2)),
      pendingCount: claims.filter((c) => c.reimbursementStatus === 'PENDING').length,
      approvedCount: claims.filter((c) => c.reimbursementStatus === 'APPROVED').length,
    };

    return res.status(200).json({ success: true, data: { claims, summary } });
  } catch (error: any) {
    return apiError(res, 'Failed to fetch reimbursement claims', 500, error);
  }
};

/**
 * PATCH /api/admin/tracking/reimbursements/:rideId
 * Approves or Rejects an agent's fuel reimbursement claim.
 */
export const updateReimbursementStatus = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const rideId = req.params.rideId as string;
    const { status, approvedAmount, notes } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const ride = await prisma.agentRide.findUnique({ where: { id: rideId } });
    if (!ride || (!isSuperAdmin && ride.adminId !== adminId)) {
      return res.status(404).json({ success: false, message: 'Ride claim not found' });
    }

    const updated = await prisma.agentRide.update({
      where: { id: rideId },
      data: {
        reimbursementStatus: status,
        approvedAmount: status === 'APPROVED' ? (approvedAmount != null ? parseFloat(approvedAmount) : ride.fuelCost) : 0,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        approvedBy: req.user?.email || adminId,
        notes: notes || undefined,
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return apiError(res, 'Failed to update reimbursement status', 500, error);
  }
};

/**
 * GET & PUT /api/admin/settings/fuel-rate
 * Company-wide ₹/km reimbursement rate management.
 */
export const getFuelRateSetting = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    let setting = await prisma.systemSetting.findFirst({ where: { adminId } });
    if (!setting) {
      setting = await prisma.systemSetting.findFirst();
    }
    return res.status(200).json({
      success: true,
      data: { fuelRatePerKm: setting?.fuelRatePerKm || 3.5 },
    });
  } catch (error: any) {
    return apiError(res, 'Failed to get fuel rate', 500, error);
  }
};

export const updateFuelRateSetting = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { fuelRatePerKm } = req.body;
    const rateNum = parseFloat(fuelRatePerKm);

    if (isNaN(rateNum) || rateNum <= 0 || rateNum > 50) {
      return res.status(400).json({ success: false, message: 'Invalid rate (must be between 0.1 and 50 ₹/km)' });
    }

    let setting = await prisma.systemSetting.findFirst({ where: { adminId } });
    if (setting) {
      setting = await prisma.systemSetting.update({
        where: { id: setting.id },
        data: { fuelRatePerKm: rateNum },
      });
    } else {
      setting = await prisma.systemSetting.create({
        data: {
          adminId,
          orgName: 'Skyline Risk Audits',
          adminEmail: req.user?.email || 'admin@skyline.in',
          slaDays: 2,
          fuelRatePerKm: rateNum,
        },
      });
    }

    return res.status(200).json({ success: true, data: { fuelRatePerKm: setting.fuelRatePerKm } });
  } catch (error: any) {
    return apiError(res, 'Failed to update fuel rate', 500, error);
  }
};
