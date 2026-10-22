import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/converra`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type ConverraSyncSummary = {
  total: number;
  withoutPhone: number;
  segmentsMapped: number;
  created: number;
  updated: number;
  failed: number;
};

export type ConverraStatus = {
  configured: boolean;
  host: string | null;
  businessId: string | null;
  connection: { ok: boolean; error: string | null; checkedAt: string } | null;
  sync: {
    running: boolean;
    startedAt: string | null;
    finishedAt: string | null;
    error: string | null;
    summary: ConverraSyncSummary | null;
  };
};

export async function getConverraStatus(): Promise<ConverraStatus> {
  const { data } = await api.get('/status');
  return data.data;
}

export async function startConverraSync(): Promise<ConverraStatus['sync']> {
  const { data } = await api.post('/sync');
  return data.data;
}
