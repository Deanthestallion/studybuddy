import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateNoteInput, UpdateNoteInput } from '@studybuddy/shared';
import { getList, http } from '../lib/api';
import type { Note } from '../lib/types';

export function useNotes(params: { search?: string; folder?: string } = {}) {
  return useQuery({
    queryKey: ['notes', params],
    queryFn: () => getList<Note[]>('/notes', { params }),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['notes'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreateNote() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreateNoteInput) => http.post('/notes', input),
    onSuccess: invalidate,
  });
}

export function useUpdateNote() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNoteInput }) =>
      http.patch(`/notes/${id}`, input),
    onSuccess: invalidate,
  });
}

export function useDeleteNote() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => http.delete(`/notes/${id}`),
    onSuccess: invalidate,
  });
}
