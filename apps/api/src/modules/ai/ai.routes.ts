import { Router } from 'express';
import {
  assistantSchema,
  generateFlashcardsSchema,
  generateNoteSchema,
  generateQuizSchema,
  summarizeNoteSchema,
} from '@studybuddy/shared';
import { requireAuth } from '../../middleware/auth';
import { rateLimit } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { aiController } from './ai.controller';

const router = Router();
router.use(requireAuth);

// AI calls are slow + costly — much tighter limit than the global one.
const aiLimiter = rateLimit({ max: 15, window: 60, prefix: 'rl:ai' });

router.get('/status', aiController.status);
router.post(
  '/generate/quiz',
  aiLimiter,
  validate(generateQuizSchema),
  asyncHandler(aiController.quiz),
);
router.post(
  '/generate/flashcards',
  aiLimiter,
  validate(generateFlashcardsSchema),
  asyncHandler(aiController.flashcards),
);
router.post(
  '/generate/note',
  aiLimiter,
  validate(generateNoteSchema),
  asyncHandler(aiController.note),
);
router.post(
  '/summarize/note',
  aiLimiter,
  validate(summarizeNoteSchema),
  asyncHandler(aiController.summarize),
);
// The planner agent makes several model round-trips — its own tighter limit.
router.post(
  '/assistant',
  rateLimit({ max: 8, window: 60, prefix: 'rl:ai:agent' }),
  validate(assistantSchema),
  asyncHandler(aiController.assistant),
);

export default router;
