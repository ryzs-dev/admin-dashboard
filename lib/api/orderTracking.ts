import { OrderTrackingInput } from "@/components/modules/tracking/types";
import axios from "axios";
import { UUID } from "crypto";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/tracking`,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function updateTrackingEntry(entryId: UUID, updates: Partial<OrderTrackingInput>) {
  const { data} = await api.patch(`/${entryId}`, updates);
  return data;
}

export async function deleteTrackingEntry(entryId: UUID) {
  const { data } = await api.delete(`/${entryId}`);
  return data;
}