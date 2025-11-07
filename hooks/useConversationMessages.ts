import { getMessagesByConversation } from '@/lib/api/message';
import useSWR from 'swr';

export function useConversationMessages(conversationId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `${conversationId}`,
    getMessagesByConversation
  );

  return {
    messages: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}
