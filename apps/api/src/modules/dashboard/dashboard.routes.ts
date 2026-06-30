import { Router } from 'express';
import { analyticsRangeSchema } from '@studybuddy/shared';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { dashboardController } from './dashboard.controller';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(dashboardController.home));
router.get(
  '/analytics',
  validate(analyticsRangeSchema, 'query'),
  asyncHandler(dashboardController.analytics),
);

export default router;
