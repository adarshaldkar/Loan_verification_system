import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { apiError } from '../../utils/helpers';

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

    return res.status(200).json({ success: true, data: activeRides });
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
