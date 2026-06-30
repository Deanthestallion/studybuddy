import { Router } from 'express';
import { createSubjectSchema, updateSubjectSchema } from '@studybuddy/shared';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { subjectsController } from './subjects.controller';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(subjectsController.list));
router.post('/', validate(createSubjectSchema), asyncHandler(subjectsController.create));
router.get('/:id', asyncHandler(subjectsController.get));
router.patch('/:id', validate(updateSubjectSchema), asyncHandler(subjectsController.update));
router.delete('/:id', asyncHandler(subjectsController.remove));

export default router;
