import { Distributor, DistributorInput } from '@/types/distributor';
import { Customer } from '@/components/modules/customer/types';
import { createNewCustomer } from '@/lib/api/customer';
import axios from 'axios';
import { UUID } from 'crypto';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/distributors`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getDistributors() {
  const { data } = await api.get('/');
  return data.distributors as Distributor[];
}

export async function createDistributor(distributor: DistributorInput) {
  try {
    const { data } = await api.post('/', distributor);
    return data as { distributor: Distributor; movedOrders: number };
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.error
      : undefined;
    console.error(message || error);
    throw new Error(message || 'Failed to add distributor');
  }
}

// The customer record a distributor's orders and addresses hang off. A distributor
// that has never ordered has none yet, so it is created from the distributor's
// name and phone; an existing customer with that phone is used as it is.
export async function ensureDistributorCustomer(
  distributor: Pick<Distributor, 'name' | 'phone_number'>
): Promise<Customer> {
  try {
    const result = await createNewCustomer({
      name: distributor.name || distributor.phone_number,
      phone_number: distributor.phone_number,
      repeat_customer: 'new',
    });
    return { total_purchase_count: 0, ...result.data } as Customer;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409 && error.response.data?.data) {
      return error.response.data.data as Customer;
    }
    throw error;
  }
}

export async function deleteDistributor(id: UUID) {
  const { data } = await api.delete(`/${id}`);
  return data as { distributor: Distributor; movedOrders: number };
}
