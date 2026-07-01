import { useMutation, useQuery } from '@tanstack/react-query';
import type { AiDifficulty, AssistantResult } from '@studybuddy/shared';
import { getData, http } from '../lib/api';

export interface GeneratedQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}
export interface GeneratedCard {
  front: string;
  back: string;
}

interface BaseGen {
  source: 'topic' | 'note';
  topic?: string;
  noteId?: string;
  subjectId?: string | null;
}
export interface GenQuizInput extends BaseGen {
  count: number;
  difficulty: AiDifficulty;
  optionsPerQuestion?: number;
}
export interface GenCardsInput extends BaseGen {
  count: number;
}

/** Whether the server has an AI key configured (gates the UI). */
export function useAiStatus() {
  return useQuery({
    queryKey: ['ai-status'],
    queryFn: () => getData<{ enabled: boolean }>('/ai/status'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateQuiz() {
  return useMutation({
    mutationFn: (input: GenQuizInput) =>
      http.post('/ai/generate/quiz', input).then((r) => r.data.data as { questions: GeneratedQuestion[] }),
  });
}

export function useGenerateFlashcards() {
  return useMutation({
    mutationFn: (input: GenCardsInput) =>
      http.post('/ai/generate/flashcards', input).then((r) => r.data.data as { cards: GeneratedCard[] }),
  });
}

export interface GeneratedNote {
  title: string;
  content: string;
}

export function useGenerateNote() {
  return useMutation({
    mutationFn: (input: { topic: string; subjectId?: string | null; length: 'short' | 'medium' | 'long' }) =>
      http.post('/ai/generate/note', input).then((r) => r.data.data as GeneratedNote),
  });
}

export function useSummarizeNote() {
  return useMutation({
    mutationFn: (input: { noteId: string; style?: 'bullets' | 'paragraph' }) =>
      http.post('/ai/summarize/note', input).then((r) => r.data.data as GeneratedNote),
  });
}

/** The planner agent: a free-form goal → the AI sets up items using app tools. */
export function useAssistant() {
  return useMutation({
    mutationFn: (prompt: string) =>
      http.post('/ai/assistant', { prompt }).then((r) => r.data.data as AssistantResult),
  });
}
