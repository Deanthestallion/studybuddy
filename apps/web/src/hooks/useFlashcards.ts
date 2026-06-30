import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateCardInput, CreateDeckInput, ReviewCardInput } from '@studybuddy/shared';
import { getData, http } from '../lib/api';
import type { Deck } from '../lib/types';

export interface Card {
  id: string;
  front: string;
  back: string;
  dueAt: string;
}
export interface DeckDetail extends Deck {
  cards: Card[];
}

export function useDecks() {
  return useQuery({ queryKey: ['decks'], queryFn: () => getData<Deck[]>('/flashcards/decks') });
}

export function useDeck(id: string | undefined) {
  return useQuery({
    queryKey: ['deck', id],
    queryFn: () => getData<DeckDetail>(`/flashcards/decks/${id}`),
    enabled: !!id,
  });
}

export function useDueCards(deckId: string | undefined) {
  return useQuery({
    queryKey: ['deck', deckId, 'due'],
    queryFn: () => getData<Card[]>(`/flashcards/decks/${deckId}/review`),
    enabled: !!deckId,
  });
}

export function useCreateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDeckInput) => http.post('/flashcards/decks', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['decks'] }),
  });
}

export function useAddCard(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCardInput) => http.post(`/flashcards/decks/${deckId}/cards`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deck', deckId] });
      qc.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

export function useReviewCard(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, grade }: { cardId: string } & ReviewCardInput) =>
      http.post(`/flashcards/cards/${cardId}/review`, { grade }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deck', deckId, 'due'] });
      qc.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}
