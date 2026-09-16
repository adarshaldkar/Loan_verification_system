import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth';
import { apiError } from '../utils/helpers';
import { geocodeAddress } from '../utils/geocoder';

export const geocodeSingle = async (req: AuthRequest, res: Response) => {
  try {
    const address = String(req.body?.address ?? '').trim();
    if (!address) return apiError(res, 'address is required', 400);

    const result = await geocodeAddress(address);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return apiError(res, 'Failed to geocode address', 500, error);
  }
};

/**
 * Resolves stored coordinates for owned cases and persists any newly
 * geocoded results back onto the case so the work is done only once.
 */
export const geocodeCaseIds = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user?.id as string;
    const caseIds: string[] = Array.isArray(req.body?.caseIds)
      ? req.body.caseIds.filter((x: any) => typeof x === 'string').slice(0, 20)
      : [];

    if (!caseIds.length) return res.status(200).json({ success: true, data: {} });

    const isAdmin = ['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(user?.role);

    const cases = await prisma.verificationCase.findMany({
      where: isAdmin
        ? { id: { in: caseIds }, adminId: userId }
        : { id: { in: caseIds }, agentId: userId },
      include: { customer: true },
    });

    const results: Record<string, any> = {};

    for (const c of cases) {
      if (c.addressLatitude != null && c.addressLongitude != null) {
        results[c.id] = {
          lat: c.addressLatitude,
          lng: c.addressLongitude,
          accuracy: c.addressAccuracy || 'street',
          source: 'stored',
        };
        continue;
      }

      const address = c.customer?.address;
      if (!address) {
        results[c.id] = { lat: null, lng: null, accuracy: 'unknown', source: 'unknown' };
        continue;
      }

      const r = await geocodeAddress(address);
      results[c.id] = r;

      if (r.lat != null && r.lng != null) {
        try {
          await prisma.verificationCase.update({
            where: { id: c.id },
            data: {
              addressLatitude: r.lat,
              addressLongitude: r.lng,
              addressAccuracy: r.accuracy === 'unknown' ? null : r.accuracy,
            },
          });
        } catch {
          // non-fatal if persist fails (client still gets coordinates)
        }
      }
    }

    return res.status(200).json({ success: true, data: results });
  } catch (error: any) {
    return apiError(res, 'Failed to resolve case locations', 500, error);
  }
};