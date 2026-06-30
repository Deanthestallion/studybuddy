import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import subjectsRoutes from './modules/subjects/subjects.routes';
import assignmentsRoutes from './modules/assignments/assignments.routes';
import notesRoutes from './modules/notes/notes.routes';
import flashcardsRoutes from './modules/flashcards/flashcards.routes';
import quizzesRoutes from './modules/quizzes/quizzes.routes';
import sessionsRoutes from './modules/sessions/sessions.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

/** All v1 API routes, mounted under /api/v1 by the app. */
export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => res.json({ status: 'ok' }));

apiRouter.use('/auth', authRoutes);
apiRouter.use('/subjects', subjectsRoutes);
apiRouter.use('/assignments', assignmentsRoutes);
apiRouter.use('/notes', notesRoutes);
apiRouter.use('/flashcards', flashcardsRoutes);
apiRouter.use('/quizzes', quizzesRoutes);
apiRouter.use('/sessions', sessionsRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
