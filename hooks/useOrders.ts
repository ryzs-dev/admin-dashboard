import { OrderTrackingInput } from '@/components/modules/tracking/types';
import {
  bulkDeleteOrders,
  createOrder,
  createOrderTrackingByOrderId,
  deleteOrder,
  getAllOrders,
  getOrderById,
  getOrderTrackingByOrderId,
  updateLineItems,
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

interface FetchOrdersParams {
  pagination: { pageIndex: number; pageSize: number };
  filters?: {
    search?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  };
  sorting?: { id: string; desc: boolean }[];
}

export function useOrders() {
  const searchParams = useSearchParams();

  const defaultFilters = useMemo(
    () => ({
      search: searchParams.get('search') || undefined,
      status:
        searchParams.get('status') !== 'all'
          ? searchParams.get('status')!
          : undefined,
      dateFrom: searchParams.get('dateFrom')
        ? new Date(searchParams.get('dateFrom')!)
        : undefined,
      dateTo: searchParams.get('dateTo')
        ? new Date(searchParams.get('dateTo')!)
        : undefined,
    }),
    [searchParams]
  );

  // Fetch orders with optional pagination & sorting
  const fetchOrders = useCallback(
    async ({
      pagination,
      filters = defaultFilters,
      sorting,
    }: FetchOrdersParams) => {
      const response = await getAllOrders({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        search: filters.search,
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sortBy: sorting?.[0]?.id,
        sortOrder: sorting?.[0]?.desc ? 'asc' : 'desc',
      });

      return {
        rows: response.orders,
        pagination: {
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
          total: response.pagination.total,
        },
      };
    },
    [defaultFilters]
  );

  const fetchOrderById = useCallback(
    (orderId: UUID) => getOrderById(orderId),
    []
  );

  return {
    fetchOrders,
    fetchOrderById,
    createOrder,
    deleteOrder,
    bulkDeleteOrders,
    updateOrder,
    updateLineItems,
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
