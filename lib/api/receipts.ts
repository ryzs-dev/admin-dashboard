import axios from 'axios';
import { Receipt, ReceiptModel, ReceiptSettings } from '@/types/receipt';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/receipts`,
  headers: { 'Content-Type': 'application/json' },
});

function apiError(error: unknown, fallback: string) {
  const message = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
  return new Error(message || fallback);
}

export async function getOrderReceipts(orderId: string) {
  const { data } = await api.get(`/order/${orderId}`);
  return data as { receipts: Receipt[]; reading_enabled: boolean };
}

export async function getUnmatchedReceipts() {
  const { data } = await api.get('/unmatched');
  return data.receipts as Receipt[];
}

export async function attachReceipt(receiptId: string, orderNumber: string) {
  try {
    const { data } = await api.post(`/${receiptId}/attach`, { order_number: orderNumber });
    return data.receipt as Receipt;
  } catch (error) {
    throw apiError(error, 'Couldn’t attach the receipt');
  }
}

export async function recheckReceipt(receiptId: string) {
  try {
    const { data } = await api.post(`/${receiptId}/recheck`);
    return data.receipt as Receipt;
  } catch (error) {
    throw apiError(error, 'Couldn’t check the receipt');
  }
}

export async function getReceiptSettings() {
  const { data } = await api.get('/settings');
  return data.settings as ReceiptSettings;
}

export async function saveReceiptSettings(patch: {
  enabled?: boolean;
  api_key?: string;
  clear_key?: boolean;
  model?: ReceiptModel;
  monthly_cap_usd?: number;
  updated_by?: string | null;
}) {
  try {
    const { data } = await api.put('/settings', patch);
    return data.settings as ReceiptSettings;
  } catch (error) {
    throw apiError(error, 'Couldn’t save the setting');
  }
}
