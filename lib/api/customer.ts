import { Customer, Query } from '@/components/modules/customer/types';
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
