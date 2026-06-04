import fetcher from '@/lib/fetcher';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL! || 'http://localhost:3001';

export function useFetchAutomation() {
  const { data, error, isLoading, mutate } = useSWR(
    `${BASE_URL}/api/automation`,
    fetcher
  );

  return {
    automations: data?.automations,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useCreateAutomation() {
  const { trigger, data, error, isMutating } = useSWRMutation(
    `${BASE_URL}/api/automation`,
    async (url, { arg }: { arg: any }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      });

      if (!response.ok) {
        throw new Error('Failed to create automation');
      }

      return response.json();
    }
  );

  return {
    createAutomation: trigger, // 👈 important
    data,
    error,
    loading: isMutating,
  };
}

export function useToggleAutomation() {
  const { trigger, data, error, isMutating } = useSWRMutation(
    `${BASE_URL}/api/automation/toggle`,
    async (_, { arg }: { arg: { id: string; is_active: boolean } }) => {
      const response = await fetch(
        `${BASE_URL}/api/automation/${arg.id}/toggle`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: arg.is_active }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle automation');
      }

      return response.json();
    }
  );

  return {
    toggleAutomation: trigger,
    data,
    error,
    loading: isMutating,
  };
}
