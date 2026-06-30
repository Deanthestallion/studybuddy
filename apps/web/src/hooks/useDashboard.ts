import { useQuery } from '@tanstack/react-query';
import { getData } from '../lib/api';
import type { Analytics, DashboardData } from '../lib/types';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getData<DashboardData>('/dashboard'),
  });
}

export function useAnalytics(range: '7d' | '30d' | '90d') {
  return useQuery({
    queryKey: ['analytics', range],
    queryFn: () => getData<Analytics>('/dashboard/analytics', { params: { range } }),
  });
}
