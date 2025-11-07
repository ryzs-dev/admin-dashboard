import useSWR from 'swr';
import { getConversations } from '@/lib/api/message';

export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR(
    'conversations',
    getConversations
  );

  return {
    conversations: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}
