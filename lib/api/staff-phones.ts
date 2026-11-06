import axios from 'axios';
import { getAccessToken } from '@/lib/auth/browser';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/staff-phones`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type StaffPhone = {
  id: string;
  phone_number: string;
  name: string;
  added_by: string | null;
  created_at: string;
};

function apiError(error: unknown, fallback: string) {
  const message = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
  return new Error(message || fallback);
}

export async function getStaffPhones() {
  const { data } = await api.get('/');
  return data.phones as StaffPhone[];
}

export async function addStaffPhone(input: { name: string; phone_number: string }) {
  try {
    const { data } = await api.post('/', input);
    return data.phones as StaffPhone[];
  } catch (error) {
    throw apiError(error, 'Couldn’t add that number');
  }
}

export async function removeStaffPhone(id: string) {
  try {
    const { data } = await api.delete(`/${id}`);
    return data.phones as StaffPhone[];
  } catch (error) {
    throw apiError(error, 'Couldn’t remove that number');
  }
}
