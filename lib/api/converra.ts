import axios from 'axios';
import { getAccessToken } from '@/lib/auth/browser';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/converra`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Every Converra route on lunaa-agent requires the signed-in user's Supabase session.
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type ConverraSyncRun = {
  id: string;
  trigger: 'manual' | 'connect';
  startedBy: string | null;
  status: 'running' | 'succeeded' | 'failed';
  startedAt: string;
  finishedAt: string | null;
  total: number;
  created: number;
  updated: number;
  failed: number;
  withoutPhone: number;
  error: string | null;
};

export type ConverraSettings = {
  autoSync: boolean;
  syncSegments: boolean;
  syncEmail: boolean;
  /** null = all customers */
  segmentIds: string[] | null;
};

export type ConverraStatus = {
  connected: boolean;
  source: 'oauth' | 'env' | null;
  workspaceName: string | null;
  businessId: string | null;
  host: string | null;
  connectedBy: string | null;
  connectedAt: string | null;
  connection: { ok: boolean; error: string | null; checkedAt: string } | null;
  settings: ConverraSettings;
  sync: {
    running: boolean;
    current: ConverraSyncRun | null;
    last: ConverraSyncRun | null;
  };
};

export type ConverraSegment = { id: string; name: string; customerCount?: number };

/** Message from a lunaa-agent error response, or a fallback. */
export function converraErrorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? fallback;
}

export async function getConverraStatus(): Promise<ConverraStatus> {
  const { data } = await api.get('/status');
  return data.data;
}

export async function startConverraConnect(): Promise<{ authorizeUrl: string }> {
  const { data } = await api.post('/connect/start');
  return data.data;
}

export async function completeConverraConnect(input: {
  code: string;
  state: string;
}): Promise<ConverraStatus> {
  const { data } = await api.post('/connect/callback', input);
  return data.data;
}

export async function disconnectConverra(): Promise<ConverraStatus> {
  const { data } = await api.post('/disconnect');
  return data.data;
}

export async function updateConverraSettings(
  patch: Partial<ConverraSettings>
): Promise<ConverraSettings> {
  const { data } = await api.patch('/settings', patch);
  return data.data;
}

export async function getConverraSegments(): Promise<ConverraSegment[]> {
  const { data } = await api.get('/segments');
  return data.data;
}

export async function startConverraSync(): Promise<ConverraSyncRun> {
  const { data } = await api.post('/sync');
  return data.data;
}

export async function getConverraSyncRuns(limit = 20): Promise<ConverraSyncRun[]> {
  const { data } = await api.get('/sync-runs', { params: { limit } });
  return data.data;
}
