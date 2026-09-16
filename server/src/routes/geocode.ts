import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { geocodeSingle, geocodeCaseIds } from '../controllers/geocodeController';

const router = Router();

// Any authenticated user (agent or admin) may geocode addresses
router.use(authenticateToken);

router.post('/geocode', geocodeSingle);
router.post('/geocode/cases', geocodeCaseIds);

export default router;