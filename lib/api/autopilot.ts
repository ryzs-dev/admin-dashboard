import axios from 'axios';
import {
  AutopilotRun,
  AutopilotSettings,
  AutopilotStep,
  RunItem,
} from '@/types/autopilot';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/autopilot`,
  headers: { 'Content-Type': 'application/json' },
});

function apiError(error: unknown, fallback: string) {
  const message = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
  return new Error(message || fallback);
}

export async function getAutopilotSettings() {
  const { data } = await api.get('/settings');
  return data.settings as AutopilotSettings;
}

export async function saveAutopilotSettings(patch: Partial<AutopilotSettings>) {
  try {
    const { data } = await api.put('/settings', patch);
    return data.settings as AutopilotSettings;
  } catch (error) {
    throw apiError(error, 'Couldn’t save the setting');
  }
}

export async function getAutopilotPreview(step: AutopilotStep) {
  const { data } = await api.get('/preview', { params: { step } });
  return data.items as RunItem[];
}

export async function getAutopilotRuns(limit = 30) {
  const { data } = await api.get('/runs', { params: { limit } });
  return data.runs as AutopilotRun[];
}

export async function runAutopilotStep(step: AutopilotStep) {
  try {
    const { data } = await api.post('/runs', { step });
    return data.run as AutopilotRun;
  } catch (error) {
    throw apiError(error, 'Couldn’t start the run');
  }
}

export async function approveAutopilotRun(id: string, approvedBy?: string) {
  try {
    const { data } = await api.post(`/runs/${id}/approve`, { approved_by: approvedBy });
    return data.run as AutopilotRun;
  } catch (error) {
    throw apiError(error, 'Couldn’t approve the batch');
  }
}

export async function dismissAutopilotRun(id: string) {
  try {
    const { data } = await api.post(`/runs/${id}/dismiss`);
    return data.run as AutopilotRun;
  } catch (error) {
    throw apiError(error, 'Couldn’t dismiss the batch');
  }
}

export async function setAutopilotHold(orderId: string, hold: boolean, runId?: string) {
  try {
    const { data } = await api.post('/hold', { order_id: orderId, hold, run_id: runId });
    return data;
  } catch (error) {
    throw apiError(error, 'Couldn’t change the hold');
  }
}
