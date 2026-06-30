import { Router } from 'express';
import { createSessionSchema } from '@studybuddy/shared';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { sessionsController } from './sessions.controller';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(sessionsController.list));
router.post('/', validate(createSessionSchema), asyncHandler(sessionsController.create));

export default router;
