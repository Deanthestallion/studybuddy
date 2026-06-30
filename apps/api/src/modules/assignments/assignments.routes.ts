import { Router } from 'express';
import {
  createAssignmentSchema,
  listAssignmentsQuerySchema,
  updateAssignmentSchema,
} from '@studybuddy/shared';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { assignmentsController } from './assignments.controller';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  validate(listAssignmentsQuerySchema, 'query'),
  asyncHandler(assignmentsController.list),
);
router.post('/', validate(createAssignmentSchema), asyncHandler(assignmentsController.create));
router.get('/:id', asyncHandler(assignmentsController.get));
router.patch('/:id', validate(updateAssignmentSchema), asyncHandler(assignmentsController.update));
router.post('/:id/toggle', asyncHandler(assignmentsController.toggle));
router.delete('/:id', asyncHandler(assignmentsController.remove));

export default router;
