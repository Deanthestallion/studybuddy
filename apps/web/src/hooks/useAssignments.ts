import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateAssignmentInput, UpdateAssignmentInput } from '@studybuddy/shared';
import { getList, http } from '../lib/api';
import type { Assignment } from '../lib/types';

interface Filters {
  status?: 'all' | 'open' | 'completed';
  subjectId?: string;
}

export function useAssignments(filters: Filters = {}) {
  return useQuery({
    queryKey: ['assignments', filters],
    queryFn: () => getList<Assignment[]>('/assignments', { params: filters }),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['assignments'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreateAssignment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreateAssignmentInput) => http.post('/assignments', input),
    onSuccess: invalidate,
  });
}

export function useToggleAssignment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => http.post(`/assignments/${id}/toggle`),
    onSuccess: invalidate,
  });
}

export function useUpdateAssignment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAssignmentInput }) =>
      http.patch(`/assignments/${id}`, input),
    onSuccess: invalidate,
  });
}

export function useDeleteAssignment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => http.delete(`/assignments/${id}`),
    onSuccess: invalidate,
  });
}
