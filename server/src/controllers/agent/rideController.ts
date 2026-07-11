import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { apiError } from '../../utils/helpers';

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

    // Verify ride
    const ride = await prisma.agentRide.findUnique({ where: { id: rideId }, include: { locations: { orderBy: { timestamp: 'desc' }, take: 1 } } });
    if (!ride || ride.agentId !== agentId || ride.status !== 'STARTED') {
      console.log(`[LOG_PING_DEBUG] Mismatch/Invalid:
        rideId=${rideId}
        agentId=${agentId}
        rideFound=${!!ride}
        rideAgentId=${ride?.agentId}
        rideStatus=${ride?.status}`);
      return res.status(403).json({ success: false, message: 'Invalid or inactive ride' });
    }

    // Calculate distance increment
    let addedDistance = 0;
    if (ride.locations.length > 0) {
      const lastLoc = ride.locations[0];
      addedDistance = calculateDistance(lastLoc.latitude, lastLoc.longitude, latitude, longitude);
    }

    // Insert location and update ride total distance in transaction
    const [newLocation, updatedRide] = await prisma.$transaction([
      prisma.agentLocation.create({
        data: {
          rideId,
          latitude,
          longitude,
          speed,
        }
      }),
      prisma.agentRide.update({
        where: { id: rideId },
        data: { totalDistance: { increment: addedDistance } }
      })
    ]);

    return res.status(200).json({ success: true, data: updatedRide });
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

    const updatedRide = await prisma.agentRide.update({
      where: { id: rideId },
      data: { status: 'COMPLETED', endTime: new Date() }
    });

    return res.status(200).json({ success: true, data: updatedRide });
  } catch (error: any) {
    return apiError(res, 'Failed to end ride', 500, error);
  }
};
