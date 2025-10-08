import { getDashboardStats } from '@/lib/api/stats';
import useSWR from 'swr';

export function useStats() {
  const { data, error, isLoading, mutate } = useSWR('stats', () =>
    getDashboardStats()
  );

  return {
    stats: data?.stats || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
