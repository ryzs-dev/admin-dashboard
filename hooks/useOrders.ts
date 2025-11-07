import { Query } from '@/components/modules/customer/types';
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
import { useCallback } from 'react';
import useSWR from 'swr';

export function useOrders(params?: Query) {
  const { data, error, isLoading, mutate } = useSWR(['orders', params], () =>
    getAllOrders(params)
  );

  // ✅ Memoize this function so it doesn't change on every render
  const fetchOrderById = useCallback(async (orderId: UUID) => {
    return await getOrderById(orderId);
  }, []);

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
    updateTrackingEntry,
    refreshOrderTracking: mutate,
    createTracking: (input: OrderTrackingInput) =>
      createOrderTrackingByOrderId(orderId, input),
    getTracking: (orderId: UUID) => getOrderTrackingByOrderId(orderId),
    updateTracking: (trackingId: UUID, updates: Partial<OrderTrackingInput>) =>
      updateTrackingEntry(trackingId, updates),
    deleteTracking: (trackingId: UUID) => deleteTrackingEntry(trackingId),
  };
}
