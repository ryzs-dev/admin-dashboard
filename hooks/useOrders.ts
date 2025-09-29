import { OrderTrackingInput } from "@/components/modules/tracking/types";
import {
  createOrder,
  createOrderTrackingByOrderId,
  deleteOrder,
  getAllOrders,
  getOrderById,
  getOrderTrackingByOrderId,
  updateOrder,
} from "@/lib/api/order";
import { UUID } from "crypto";
import useSWR from "swr";

export function useOrders() {
  const { data, error, isLoading, mutate } = useSWR("orders", () =>
    getAllOrders()
  );

  return {
    orders: data?.orders,
    isLoading,
    isError: error,
    refresh: mutate,
    createOrder,
    deleteOrder,
    updateOrder,
    getOrderById,
  };
}

export function useOrderTracking(orderId: UUID) {
  const { data, error, isLoading, mutate } = useSWR(
    orderId ? ["order-tracking", orderId] : null,
    () => getOrderTrackingByOrderId(orderId)
  );

  return {
    tracking: data?.tracking, // full timeline
    isLoading,
    isError: error,
    refreshOrderTracking: mutate,
    createTracking: (input: OrderTrackingInput) =>
      createOrderTrackingByOrderId(orderId, input),
    getTracking: (orderId: UUID) => getOrderTrackingByOrderId(orderId),
  };
}
