import { ShipmentInput } from '@/components/modules/parcel-daily/types';
import axios from 'axios';
import { UUID } from 'crypto';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/parcel-daily`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getParcelDailyAccountInfo() {
  const { data } = await api.get('/account-info');
  return data;
}

export async function createParcelDailyShipment(
  shipmentData: ShipmentInput,
  orderId: UUID
) {
  const { data } = await api.post('/order/create', { shipmentData, orderId });
  return data;
}

export async function createBulkParcelDailyShipments(
  shipments: ShipmentInput[]
) {
  try {
    const { data } = await api.post('/order/create/bulk', { shipments });
    return data as { success: boolean; data: unknown };
  } catch (error: any) {
    console.error(error?.response?.data || error.message);
    throw new Error(
      error?.response?.data?.error || 'Failed to create bulk shipments'
    );
  }
}
