
import { AddressInput } from "@/types/address";
import axios from "axios";
import { UUID } from "crypto";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/addresses`,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getAddresses(params?: Record<string, string | number | boolean>) {
  const {data} = await api.get("/", { params });
  return data;
}

export async function getAddressById(id: UUID) {
  const { data } = await api.get(`/${id}`);
  return data;
}

export async function getAddressByCustomerId(customerId: UUID) {
  const { data } = await api.get(`/customer/${customerId}`);
  return data;
}

export async function createAddress(address: AddressInput) {
  const { data } = await api.post("/", address);
  return data;
}

export async function updateAddress(
  id: UUID,
  address: Partial<AddressInput>
) {
  const { data } = await api.patch(`/${id}`, address);
  return data;
}

export async function deleteAddress(id: UUID) {
  const { data } = await api.delete(`/${id}`);
  return data;
}
