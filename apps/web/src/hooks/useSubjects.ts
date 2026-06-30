import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSubjectInput, UpdateSubjectInput } from '@studybuddy/shared';
import { getData, http } from '../lib/api';
import type { Subject } from '../lib/types';

export function useSubjects() {
  return useQuery({ queryKey: ['subjects'], queryFn: () => getData<Subject[]>('/subjects') });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubjectInput) => http.post('/subjects', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubjectInput }) =>
      http.patch(`/subjects/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.delete(`/subjects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
