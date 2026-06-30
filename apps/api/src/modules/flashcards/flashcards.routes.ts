import { Router } from 'express';
import {
  createCardSchema,
  createDeckSchema,
  reviewCardSchema,
  updateCardSchema,
  updateDeckSchema,
} from '@studybuddy/shared';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { flashcardsController } from './flashcards.controller';

const router = Router();
router.use(requireAuth);

// Decks
router.get('/decks', asyncHandler(flashcardsController.listDecks));
router.post('/decks', validate(createDeckSchema), asyncHandler(flashcardsController.createDeck));
router.get('/decks/:id', asyncHandler(flashcardsController.getDeck));
router.patch('/decks/:id', validate(updateDeckSchema), asyncHandler(flashcardsController.updateDeck));
router.delete('/decks/:id', asyncHandler(flashcardsController.removeDeck));

// Cards within a deck
router.post('/decks/:id/cards', validate(createCardSchema), asyncHandler(flashcardsController.addCard));
router.patch('/cards/:cardId', validate(updateCardSchema), asyncHandler(flashcardsController.updateCard));
router.delete('/cards/:cardId', asyncHandler(flashcardsController.removeCard));

// Spaced repetition
router.get('/decks/:id/review', asyncHandler(flashcardsController.due));
router.post('/cards/:cardId/review', validate(reviewCardSchema), asyncHandler(flashcardsController.review));

export default router;
