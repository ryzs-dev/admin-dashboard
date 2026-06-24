import {
  getDashboardStats,
  getProductMonthlyTrends,
  getProductPerformance,
} from '@/lib/api/stats';
import { EMPTY_DASHBOARD_STATS } from '@/types/stats';
import useSWR from 'swr';

export function useStats(month: string) {
  const { data, error, isLoading, mutate } = useSWR(
    ['stats', month],
    () => getDashboardStats(month),
    { revalidateOnFocus: false }
  );

  return {
    stats: data?.stats ?? EMPTY_DASHBOARD_STATS,
    revenueChart: data?.charts?.revenue ?? [],
    customerChart: data?.charts?.customer_acquisition ?? [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useProductPerformance(month: string) {
  const { data, error, isLoading, mutate } = useSWR(
    ['product-performance', month],
    () => getProductPerformance(month),
    { revalidateOnFocus: false }
  );

  return {
    products: data?.products ?? [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useProductMonthlyTrends(
  productId: string | null,
  month: string,
  monthsBack = 6
) {
  const { data, error, isLoading, mutate } = useSWR(
    productId ? ['product-trends', productId, month, monthsBack] : null,
    () => getProductMonthlyTrends(productId!, month, monthsBack),
    { revalidateOnFocus: false }
  );

  return {
    trends: data?.trends ?? [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
