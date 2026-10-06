import {
  getDashboardStats,
  getProductMonthlyTrends,
  getProductPerformance,
} from '@/lib/api/stats';
import {
  EMPTY_CHANNEL_TOTALS,
  EMPTY_DASHBOARD_STATS,
  EMPTY_REPEAT_ORDER_VALUE,
} from '@/types/stats';
import useSWR from 'swr';

export function useStats(month: string) {
  const { data, error, isLoading, mutate } = useSWR(
    ['stats', month],
    () => getDashboardStats(month),
    { revalidateOnFocus: false }
  );

  return {
    stats: data?.stats ?? EMPTY_DASHBOARD_STATS,
    repeatOrderValue: data?.repeat_order_value ?? EMPTY_REPEAT_ORDER_VALUE,
    channels: data?.channels ?? EMPTY_CHANNEL_TOTALS,
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
