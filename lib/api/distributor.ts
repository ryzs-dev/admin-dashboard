import { Distributor, DistributorInput } from '@/types/distributor';
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

export async function deleteDistributor(id: UUID) {
  const { data } = await api.delete(`/${id}`);
  return data as { distributor: Distributor; movedOrders: number };
}
