import { Router } from 'express';
import { createQuizSchema, submitAttemptSchema, updateQuizSchema } from '@studybuddy/shared';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { quizzesController } from './quizzes.controller';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(quizzesController.list));
router.post('/', validate(createQuizSchema), asyncHandler(quizzesController.create));
router.get('/:id', asyncHandler(quizzesController.get));
router.patch('/:id', validate(updateQuizSchema), asyncHandler(quizzesController.update));
router.delete('/:id', asyncHandler(quizzesController.remove));
router.post('/:id/attempts', validate(submitAttemptSchema), asyncHandler(quizzesController.submit));
router.get('/:id/attempts', asyncHandler(quizzesController.attempts));

export default router;
