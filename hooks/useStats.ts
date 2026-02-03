import { getDashboardStats } from '@/lib/api/stats';
import useSWR from 'swr';

export function useStats(month: string) {
  const { data, error, isLoading, mutate } = useSWR(
    ['stats', month],
    () => getDashboardStats(month),
    { revalidateOnFocus: false }
  );

  return {
    stats: data?.stats ?? [],
    revenueChart: data?.charts?.revenue ?? [],
    customerChart: data?.charts?.customer_acquisition ?? [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
