import { MessageInput } from '@/types/message';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/message`,
});

export async function sendMessage(message: MessageInput) {
  if (!message.to_number) {
    throw new Error('Recipient number is required');
  }
  const { data } = await api.post('/template', message);
  return data;
}
