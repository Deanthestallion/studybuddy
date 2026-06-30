import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateQuizInput, SubmitAttemptInput } from '@studybuddy/shared';
import { getData, http } from '../lib/api';

export interface QuizSummary {
  id: string;
  title: string;
  timeLimitSec: number;
  subjectId: string | null;
  _count: { questions: number; attempts: number };
}
export interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  order: number;
}
export interface QuizDetail extends Omit<QuizSummary, '_count'> {
  questions: Question[];
}
export interface AttemptResult {
  attemptId: string;
  score: number;
  total: number;
  percentage: number;
  breakdown: Array<{ questionId: string; chosen: number | null; correctIndex: number; correct: boolean }>;
}

export function useQuizzes() {
  return useQuery({ queryKey: ['quizzes'], queryFn: () => getData<QuizSummary[]>('/quizzes') });
}

export function useQuiz(id: string | undefined) {
  return useQuery({
    queryKey: ['quiz', id],
    queryFn: () => getData<QuizDetail>(`/quizzes/${id}`),
    enabled: !!id,
  });
}

export function useCreateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuizInput) => http.post('/quizzes', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quizzes'] }),
  });
}

export function useSubmitAttempt(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitAttemptInput) =>
      http.post(`/quizzes/${quizId}/attempts`, input).then((r) => r.data.data as AttemptResult),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quizzes'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
