import useSWR from 'swr';
import {
  getAutopilotPreview,
  getAutopilotRuns,
  getAutopilotSettings,
} from '@/lib/api/autopilot';
import { AutopilotStep } from '@/types/autopilot';

export function useAutopilotSettings() {
  const { data, error, isLoading, mutate } = useSWR('autopilot-settings', getAutopilotSettings, {
    revalidateOnFocus: false,
  });
  return { settings: data, isLoading, isError: error, mutate };
}

export function useAutopilotRuns() {
  const { data, error, isLoading, mutate } = useSWR('autopilot-runs', () => getAutopilotRuns(30), {
    // Poll while something is in flight so a running batch updates by itself.
    refreshInterval: (runs) =>
      runs?.some((run) => run.status === 'running' || run.status === 'awaiting_approval')
        ? 5000
        : 30000,
  });
  return { runs: data ?? [], isLoading, isError: error, mutate };
}

export function useAutopilotPreview(step: AutopilotStep) {
  const { data, error, isLoading, mutate } = useSWR(
    ['autopilot-preview', step],
    () => getAutopilotPreview(step),
    { refreshInterval: 60000, revalidateOnFocus: false }
  );
  return { items: data ?? [], isLoading, isError: error, mutate };
}
