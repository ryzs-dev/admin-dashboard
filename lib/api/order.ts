import { OrderTrackingInput } from "@/components/modules/tracking/types";
import { OrderInput } from "@/types/order";
import axios from "axios";
import { UUID } from "crypto";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/orders`,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getAllOrders() {
    const {data} = await api.get("/");
    return data;
}

export async function getOrderById(id: UUID) {
    const {data} = await api.get(`/${id}`);
    return data;
}

export async function getOrderByCustomerId(customer_id: UUID) {
    const {data} = await api.get(`/customer/${customer_id}`);
    return data;
}

export async function createOrder(order: OrderInput) {
    const {data} = await api.post("/", order);
    return data;
}

export async function updateOrder(id: UUID, order: Partial<OrderInput>) {
    const {data} = await api.patch(`/${id}`, order);
    return data;
}

export async function deleteOrder(id: UUID) {
    const {data} = await api.delete(`/${id}`);
    return data;
}

export async function createOrderTrackingByOrderId(id: UUID, orderTrackingData: OrderTrackingInput){
    const {data} = await api.post(`/${id}/tracking`, orderTrackingData);
    return data;
}