import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/broadcast`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function deleteBroadcast(broadcastId: string) {
  try {
    const broadcast = await api.delete(`/${broadcastId}`);
    return broadcast;
  } catch (error: any) {
    console.error('Error deleting broadcast:', error.response?.data || error);
    throw error;
  }
}

export async function triggerBroadcast(broadcastId: string) {
  try {
    const broadcast = await api.post(`/trigger/${broadcastId}`);
    return broadcast;
  } catch (error: any) {
    console.error('Error sending broadcast:', error.response?.data || error);
    throw error;
  }
}
