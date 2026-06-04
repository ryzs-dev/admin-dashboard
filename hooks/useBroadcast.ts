import fetcher from '@/lib/fetcher';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL! || 'http://localhost:3001';

export function useFetchBroadcasts() {
  const { data, error, isLoading, mutate } = useSWR(
    `${BASE_URL}/api/broadcast`,
    fetcher
  );

  return {
    broadcasts: data?.data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useFetchBroadcast(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${BASE_URL}/api/broadcast/${id}` : null,
    fetcher
  );

  return {
    broadcast: data?.data || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useCreateBroadcast() {
  const { trigger, isMutating } = useSWRMutation(
    `${BASE_URL}/api/broadcast`,
    async (url, { arg }: { arg: any }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      });
      if (!response.ok) throw new Error('Failed to create broadcast');
      return response.json();
    }
  );

  return { createBroadcast: trigger, isCreating: isMutating };
}
