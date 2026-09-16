"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const geocodeController_1 = require("../controllers/geocodeController");
const router = (0, express_1.Router)();
// Any authenticated user (agent or admin) may geocode addresses
router.use(auth_1.authenticateToken);
router.post('/geocode', geocodeController_1.geocodeSingle);
router.post('/geocode/cases', geocodeController_1.geocodeCaseIds);
exports.default = router;
