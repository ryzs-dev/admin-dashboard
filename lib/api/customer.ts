import { CustomerInput } from "@/types/customer";
import axios from "axios";
import { UUID } from "crypto";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/customers`,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getCustomers(params?: Record<string, string | number | boolean>) {
  const {data} = await api.get("/", { params });
  return data;
}

export async function getCustomer(phone_number: string) {
  const { data } = await api.get(`/${phone_number}`);
  return data;
}

export async function createCustomer(customer: CustomerInput) {
  const { data } = await api.post("/", customer);
  return data;
}

export async function updateCustomer(
  id: UUID,
  customer: Partial<CustomerInput>
) {
  const { data } = await api.patch(`/${id}`, customer);
  return data;
}

export async function deleteCustomer(id: UUID) {
  const { data } = await api.delete(`/${id}`);
  return data;
}
