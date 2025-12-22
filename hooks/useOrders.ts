import { OrderTrackingInput } from '@/components/modules/tracking/types';
import {
  bulkDeleteOrders,
  createOrder,
  createOrderTrackingByOrderId,
  deleteOrder,
  getAllOrders,
  getOrderById,
  getOrderTrackingByOrderId,
  updateOrder,
} from '@/lib/api/order';
import {
  deleteTrackingEntry,
  updateTrackingEntry,
} from '@/lib/api/orderTracking';
import { UUID } from 'crypto';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';

export function useOrders() {
  const filters = useSearchParams();

  const params = useMemo(
    () => ({
      search: filters.get('search') || undefined,
      status:
        filters.get('status') !== 'all' ? filters.get('status') : undefined,
      dateFrom: filters.get('dateFrom')
        ? new Date(filters.get('dateFrom')!)
        : undefined,
      dateTo: filters.get('dateTo')
        ? new Date(filters.get('dateTo')!)
        : undefined,
    }),
    [filters]
  );

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
  };
}

export function useOrderTracking(orderId: UUID) {
  const { data, error, isLoading, mutate } = useSWR(
    orderId ? ['order-tracking', orderId] : null,
    () => getOrderTrackingByOrderId(orderId)
  );

  return {
    tracking: data?.tracking_entries || [], // full timeline
    refreshTracking: mutate,
    isLoading,
    isError: error,
    refreshOrderTracking: mutate,
    createTracking: (input: OrderTrackingInput) =>
      createOrderTrackingByOrderId(orderId, input),
    getTracking: (orderId: UUID) => getOrderTrackingByOrderId(orderId),
    updateTracking: (trackingId: UUID, updates: Partial<OrderTrackingInput>) =>
      updateTrackingEntry(trackingId, updates),
    deleteTracking: (trackingId: UUID) => deleteTrackingEntry(trackingId),
  };
}
