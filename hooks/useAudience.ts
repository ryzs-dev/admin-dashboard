import fetcher from '@/lib/fetcher';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL! || 'http://localhost:3001';

export function useCreateSegment() {
  const { trigger, isMutating } = useSWRMutation(
    `${BASE_URL}/api/audience`,
    async (url, { arg }: { arg: any }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      });
      if (!response.ok) throw new Error('Failed to create segment');
      return response.json();
    }
  );

  return { createSegment: trigger, isCreating: isMutating };
}

export function useFetchSegments() {
  const { data, error, isLoading, mutate } = useSWR(
    `${BASE_URL}/api/audience`,
    fetcher
  );

  return {
    segments: data?.data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useFetchSegmentMembers(segmentId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    segmentId ? `${BASE_URL}/api/audience/${segmentId}/users` : null,
    fetcher
  );

  return {
    members: data?.data || [],
    segment: data?.data || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useInsertMembers(segmentId: string) {
  const { trigger, isMutating } = useSWRMutation(
    `${BASE_URL}/api/audience/${segmentId}/users`,
    async (url, { arg }: { arg: string[] }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: arg }),
      });
      if (!response.ok) throw new Error('Failed to add member');
      return response.json();
    }
  );

  return { addMembers: trigger, isAdding: isMutating };
}
