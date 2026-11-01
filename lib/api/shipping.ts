import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/shipping`,
  headers: { 'Content-Type': 'application/json' },
});

export interface ShippingRules {
  fallback_courier: string | null;
  cod_courier: string | null;
  detect_cod: boolean;
  updated_at: string;
  updated_by: string | null;
}

export async function getShippingRules() {
  const { data } = await api.get('/rules');
  return data.rules as ShippingRules;
}

export async function saveShippingRules(
  patch: Partial<Pick<ShippingRules, 'fallback_courier' | 'cod_courier' | 'detect_cod'>> & {
    updated_by?: string | null;
  }
) {
  try {
    const { data } = await api.put('/rules', patch);
    return data.rules as ShippingRules;
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
    throw new Error(message || 'Couldn’t save the shipping rule');
  }
}
