import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/stats`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getDashboardStats() {
  const { data } = await api.get('/dashboard');
  return data;
}
