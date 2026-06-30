import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSessionInput } from '@studybuddy/shared';
import { getData, http } from '../lib/api';
import { useAuthStore } from '../store/auth';
import type { StudySession } from '../lib/types';

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => getData<StudySession[]>('/sessions'),
  });
}

export function useLogSession() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (input: CreateSessionInput) => http.post('/sessions', input),
    onSuccess: (res) => {
      // Reflect freshly awarded XP/level/streak immediately in the header.
      const { awardedXp, level, streak } = res.data.data as {
        awardedXp: number;
        level: number;
        streak: number;
      };
      if (user) setUser({ ...user, xp: user.xp + awardedXp, level, streak });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
