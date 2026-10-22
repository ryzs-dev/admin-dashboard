import { ConverraStatus, getConverraStatus } from '@/lib/api/converra';
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
