import {
  ConverraSegment,
  ConverraStatus,
  ConverraSyncRun,
  getConverraSegments,
  getConverraStatus,
  getConverraSyncRuns,
} from '@/lib/api/converra';
import useSWR from 'swr';

export function useConverraStatus() {
  const { data, error, isLoading, mutate } = useSWR<ConverraStatus>(
    'converra-status',
    getConverraStatus,
    {
      // Poll while a sync is running so the page shows progress without a refresh.
      refreshInterval: (latest) => (latest?.sync.running ? 3000 : 0),
    }
  );
  return { status: data, isLoading, isError: !!error, refresh: mutate };
}

export function useConverraSyncRuns(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<ConverraSyncRun[]>(
    enabled ? 'converra-sync-runs' : null,
    () => getConverraSyncRuns(20),
    {
      refreshInterval: (latest) =>
        latest?.some((run) => run.status === 'running') ? 3000 : 0,
    }
  );
  return { runs: data, isLoading, isError: !!error, refresh: mutate };
}

export function useConverraSegments(enabled = true) {
  const { data, error, isLoading } = useSWR<ConverraSegment[]>(
    enabled ? 'converra-segments' : null,
    getConverraSegments,
    { revalidateOnFocus: false }
  );
  return { segments: data, isLoading, isError: !!error };
}
