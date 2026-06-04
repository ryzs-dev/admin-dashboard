import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/audience`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function deleteSegment(segmentId: string) {
  try {
    const segment = await api.delete(`/${segmentId}`);
    return segment;
  } catch (error: any) {
    console.error('Error deleting segment:', error.response?.data || error);
    throw error;
  }
}

export async function removeUser(segmentId: string, userId: string) {
  try {
    const user = await api.delete(`/${segmentId}/users/${userId}`);
    return user;
  } catch (error: any) {
    console.error('Error removing user:', error.response?.data || error);
    throw error;
  }
}
