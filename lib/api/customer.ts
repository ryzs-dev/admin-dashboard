import {
  CountryCode,
  Customer,
  Query,
} from '@/components/modules/customer/types';
import { CustomerInput } from '@/types/customer';
import axios from 'axios';
import { UUID } from 'crypto';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/customers`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getCustomers(params?: Query) {
  const res = await api.get('/', { params });
  return res.data as {
    data: Customer[];
    pagination: { limit: number; offset: number; total: number };
  };
}

export async function getCustomerSummary() {
  const res = await api.get('/summary');
  return res.data as {
    total: number;
    returning: number;
    new: number;
    countries?: Record<CountryCode, number>;
  };
}

export async function getAllCustomerIds(params: {
  search?: string;
  filter?: 'all' | 'today' | 'week' | 'month';
}) {
  const res = await api.get('/ids', { params });
  return res.data.ids as string[];
}

export async function getCustomer(phone_number: string) {
  const { data } = await api.get(`/${phone_number}`);
  return data;
}

export async function getCustomerById(id: UUID) {
  const { data } = await api.get(`/id/${id}`);
  return data;
}

export async function createCustomer(customer: CustomerInput) {
  const { data } = await api.post('/', customer);
  return data;
}

// Fails with 409 (and the existing customer in `data`) if the phone number is taken.
export async function createNewCustomer(customer: CustomerInput) {
  const { data } = await api.post('/', customer, { params: { mode: 'create' } });
  return data;
}

export async function updateCustomer(
  id: UUID,
  customer: Partial<CustomerInput>
) {
  try {
    const { data } = await api.patch(`/${id}`, customer);
    return data;
  } catch (error) {
    console.error(
      'Error updating customer:',
      axios.isAxiosError(error) ? error.response?.data ?? error : error
    );
    throw error;
  }
}

export type FollowUp = {
  id: UUID;
  name: string | null;
  phone_number: string;
  last_order_date: string | null;
  days_since: number | null;
  total_purchase_count: number;
  total_amount_spent: number;
  last_order_id: UUID | null;
  last_order_number: string | null;
  last_items: string | null;
};

export async function getFollowUps(days: number, offset = 0, limit = 50) {
  const { data } = await api.get<{
    days: number;
    until: number | null;
    total: number;
    counts: { days: number; total: number }[];
    customers: FollowUp[];
  }>('/follow-ups', { params: { days, offset, limit } });
  return data;
}

export type DuplicateCustomer = {
  id: UUID;
  name: string | null;
  phone_number: string;
  total_purchase_count: number | null;
  total_amount_spent: number | null;
  created_at: string;
};

export async function getDuplicateCustomers() {
  const { data } = await api.get<{ groups: { key: string; customers: DuplicateCustomer[] }[] }>(
    '/duplicates'
  );
  return data.groups;
}

export async function mergeCustomers(keepId: UUID, mergeId: UUID) {
  const { data } = await api.post('/merge', { keepId, mergeId });
  return data;
}

export async function deleteCustomer(id: UUID) {
  const { data } = await api.delete(`/${id}`);
  return data;
}
