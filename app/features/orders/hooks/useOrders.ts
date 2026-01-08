import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import {
  bulkDeleteOrders,
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderById,
  updateLineItems,
  updateOrder,
} from '@/lib/api/order';
import { UUID } from 'crypto';

export function useOrders() {
  const filters = useSearchParams();

  const params = useMemo(() => {
    const page = Number(filters.get('page') ?? 1);

    return {
      search: filters.get('search') || undefined,
      status:
        filters.get('status') !== 'all' ? filters.get('status') : undefined,
      dateFrom: filters.get('dateFrom')
        ? new Date(filters.get('dateFrom')!)
        : undefined,
      dateTo: filters.get('dateTo')
        ? new Date(filters.get('dateTo')!)
        : undefined,
      offset: page - 1,
      page,
    };
  }, [filters]);

  const { data, error, isLoading, mutate } = useSWR(
    ['orders', JSON.stringify(params)],
    () => getAllOrders(params)
  );

  const fetchOrderById = useCallback(
    (orderId: UUID) => getOrderById(orderId),
    []
  );

  return {
    orders: data?.orders,
    pagination: data?.pagination,
    isLoading,
    isError: error,
    refresh: mutate,
    createOrder,
    deleteOrder,
    bulkDeleteOrders,
    updateOrder,
    fetchOrderById,
    updateLineItems,
  };
}