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

export type ParcelDailyAccount = {
  credit: string;
  topupPackage: string;
  packageValidDays: number;
  expiresIn: number;
  packageBoughtAt: string;
};

export type PickupAddress = {
  fullName: string;
  countryCode: '+60';
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  state: string;
  country: 'Malaysia';
};

export type ShippingDefaults = {
  kg: number;
  isDropoff: boolean;
  courier: string;
};

export type ParcelDailySettings = {
  pickupAddress: PickupAddress;
  defaults: ShippingDefaults;
  updatedAt: string | null;
  connection?: { environment: 'live' | 'sandbox'; merchantId: string };
};

export async function getParcelDailySettings() {
  const { data } = await api.get('/settings');
  return data.data as ParcelDailySettings;
}

export async function saveParcelDailySettings(
  settings: Pick<ParcelDailySettings, 'pickupAddress' | 'defaults'>
) {
  const { data } = await api.put('/settings', settings);
  return data.data as ParcelDailySettings;
}

export type CourierQuote = {
  code: string;
  name: string;
  price: number;
  postage: number;
  codFee: number;
};

export async function getCourierQuotes(input: {
  postcode: string;
  country: 'Malaysia' | 'Singapore';
  weight: number;
  cod?: number;
}) {
  const { data } = await api.post('/quote', input);
  return data.data as {
    couriers: CourierQuote[];
    destination: { state: string | null; city: string | null };
  };
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
  } catch (error) {
    const body = axios.isAxiosError(error) ? error.response?.data : undefined;
    console.error(body || error);
    throw new Error(body?.error || 'Failed to create bulk shipments');
  }
}
