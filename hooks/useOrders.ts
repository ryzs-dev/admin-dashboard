import { createOrder, createOrderTrackingByOrderId, deleteOrder, getAllOrders, getOrderById, updateOrder } from "@/lib/api/order";
import useSWR from "swr";

export function useOrders() {
  const { data, error, isLoading, mutate } = useSWR("orders", () => getAllOrders());

  return {
    orders: data?.orders,
    isLoading,
    isError: error,
    refresh: mutate,
    createOrder,
    deleteOrder,
    updateOrder,
    getOrderById,
    createOrderTrackingByOrderId
  };
}