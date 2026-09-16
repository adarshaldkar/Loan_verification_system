"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocodeCaseIds = exports.geocodeSingle = void 0;
const db_1 = __importDefault(require("../config/db"));
const helpers_1 = require("../utils/helpers");
const geocoder_1 = require("../utils/geocoder");
const geocodeSingle = async (req, res) => {
    try {
        const address = String(req.body?.address ?? '').trim();
        if (!address)
            return (0, helpers_1.apiError)(res, 'address is required', 400);
        const result = await (0, geocoder_1.geocodeAddress)(address);
        return res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to geocode address', 500, error);
    }
};
exports.geocodeSingle = geocodeSingle;
/**
 * Resolves stored coordinates for owned cases and persists any newly
 * geocoded results back onto the case so the work is done only once.
 */
const geocodeCaseIds = async (req, res) => {
    try {
        const user = req.user;
        const userId = user?.id;
        const caseIds = Array.isArray(req.body?.caseIds)
            ? req.body.caseIds.filter((x) => typeof x === 'string').slice(0, 20)
            : [];
        if (!caseIds.length)
            return res.status(200).json({ success: true, data: {} });
        const isAdmin = ['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(user?.role);
        const cases = await db_1.default.verificationCase.findMany({
            where: isAdmin
                ? { id: { in: caseIds }, adminId: userId }
                : { id: { in: caseIds }, agentId: userId },
            include: { customer: true },
        });
        const results = {};
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
            const r = await (0, geocoder_1.geocodeAddress)(address);
            results[c.id] = r;
            if (r.lat != null && r.lng != null) {
                try {
                    await db_1.default.verificationCase.update({
                        where: { id: c.id },
                        data: {
                            addressLatitude: r.lat,
                            addressLongitude: r.lng,
                            addressAccuracy: r.accuracy === 'unknown' ? null : r.accuracy,
                        },
                    });
                }
                catch {
                    // non-fatal if persist fails (client still gets coordinates)
                }
            }
        }
        return res.status(200).json({ success: true, data: results });
    }
    catch (error) {
        return (0, helpers_1.apiError)(res, 'Failed to resolve case locations', 500, error);
    }
};
exports.geocodeCaseIds = geocodeCaseIds;
