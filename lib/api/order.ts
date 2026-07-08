import { Query } from '@/components/modules/customer/types';
import { OrderTrackingInput } from '@/components/modules/tracking/types';
import { OrderInput, UpdateLineItemsInput } from '@/types/order';
import { Order } from '@/components/modules/order/types';
import axios from 'axios';
import { UUID } from 'crypto';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/orders`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getAllOrders(params?: Query) {
  const { search, dateFrom, dateTo, offset, tracking, location } = params ?? {};

  const isFiltered =
    !!search || !!dateFrom || !!dateTo || !!tracking || !!location;

  const queryParams: Record<string, any> = {
    ...params,
    limit: isFiltered ? undefined : (params?.limit ?? 100),
    offset: offset ?? 0,
  };

  const res = await api.get('/', { params: queryParams });

  return res.data as {
    total: number;
    orders: Order[];
    pagination: { limit: number; offset: number; total: number };
  };
}

export async function getOrderById(id: UUID) {
  const { data } = await api.get(`/${id}`);
  return data;
}

export async function getOrderByCustomerId(customer_id: UUID) {
  const { data } = await api.get(`/customer/${customer_id}`);
  return data;
}

export async function createOrder(order: OrderInput) {
  try {
    const { data } = await api.post('/', order);
    return data as {
      success: boolean;
      message: string;
      order: { id: string; order_number?: string };
    };
  } catch (error: any) {
    console.error(error?.response?.data || error.message);
    throw new Error(
      error?.response?.data?.error || 'Failed to create order'
    );
  }
}

export type BulkShipmentResultItem = {
  order_id: string;
  success: boolean;
  error?: string;
  data?: unknown;
};

export async function createBulkOrder(
  orderIds: string[],
  options?: { isDropoff?: boolean }
) {
  try {
    const { data } = await api.post('/create/bulk', {
      order_ids: orderIds,
      is_dropoff: options?.isDropoff === true,
    });

    return data as {
      success: boolean;
      message: string;
      succeeded: number;
      failed: number;
      results: BulkShipmentResultItem[];
    };
  } catch (error: any) {
    console.error(error?.response?.data || error.message);

    throw new Error(
      error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Failed to create bulk shipments'
    );
  }
}

export async function updateOrder(id: UUID, order: Partial<OrderInput>) {
  const { data } = await api.patch(`/${id}`, order);
  return data;
}

export async function deleteOrder(id: UUID) {
  const { data } = await api.delete(`/${id}`);
  return data;
}

export async function bulkDeleteOrders(ids: UUID[]) {
  const { data } = await api.delete('/bulk', { data: { ids } });
  return data;
}

export async function createOrderTrackingByOrderId(
  id: UUID,
  orderTrackingData: OrderTrackingInput
) {
  const { data } = await api.post(`/${id}/tracking`, orderTrackingData);
  return data;
}

export async function getOrderTrackingByOrderId(id: UUID) {
  const { data } = await api.get(`/${id}/tracking`);
  return data;
}

export async function updateLineItems(
  order_id: UUID,
  payload: UpdateLineItemsInput
) {
  const { data } = await api.patch(`/${order_id}/line-items`, payload);
  return data;
}
