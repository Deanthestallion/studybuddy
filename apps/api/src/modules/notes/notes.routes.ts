import { Router } from 'express';
import { createNoteSchema, listNotesQuerySchema, updateNoteSchema } from '@studybuddy/shared';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { notesController } from './notes.controller';

const router = Router();
router.use(requireAuth);

router.get('/', validate(listNotesQuerySchema, 'query'), asyncHandler(notesController.list));
router.get('/folders', asyncHandler(notesController.folders));
router.post('/', validate(createNoteSchema), asyncHandler(notesController.create));
router.get('/:id', asyncHandler(notesController.get));
router.patch('/:id', validate(updateNoteSchema), asyncHandler(notesController.update));
router.delete('/:id', asyncHandler(notesController.remove));

export default router;
