import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-providers';
import {
  getAutopilotPreview,
  getAutopilotRuns,
  getAutopilotSettings,
  saveAutopilotSettings,
} from '@/lib/api/autopilot';
import { AutopilotSettings, AutopilotStep } from '@/types/autopilot';

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

// Saves one setting at a time: shows it at once, rolls back if the server refuses.
export function useSaveAutopilotSettings() {
  const { user } = useAuth();
  const { settings, mutate } = useAutopilotSettings();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const save = async (patch: Partial<AutopilotSettings>) => {
    if (!settings) return;
    setSaveState('saving');
    mutate({ ...settings, ...patch }, { revalidate: false });
    try {
      const saved = await saveAutopilotSettings({ ...patch, updated_by: user?.email ?? null });
      mutate(saved, { revalidate: false });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      mutate(settings, { revalidate: false });
      setSaveState('idle');
      toast.error(error instanceof Error ? error.message : 'Couldn’t save the setting');
    }
  };

  return { save, saveState };
}
