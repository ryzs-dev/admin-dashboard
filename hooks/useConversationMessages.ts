import {
  getMessagesByConversation,
  sendMessage as sendMessageApi,
} from '@/lib/api/message';
import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { useChatSocket } from './useChatSockets';
import { MessageInput } from '@/types/message';

export function useConversationMessages(conversationId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    conversationId ? `/conversations/${conversationId}/messages` : null,
    () => getMessagesByConversation(conversationId)
  );

  const [messages, setMessages] = useState(data || []);

  useEffect(() => {
    setMessages(data || []);
  }, [data]);

  const handleNewMessage = useCallback(
    (msg: any) => {
      console.log('📩 handleNewMessage fired:', msg);
      mutate(
        (current: any) => {
          console.log('📩 current SWR data:', current);
          const existing = current?.data ?? [];
          return { ...current, data: [...existing, msg] };
        },
        { revalidate: false }
      );
    },
    [mutate]
  );

  const handleSend = useCallback(
    async (message: MessageInput) => {
      await sendMessageApi(message);
      await mutate();
    },
    [mutate]
  );

  useChatSocket(conversationId, handleNewMessage);

  return {
    messages: data,
    error,
    isLoading,
    refresh: mutate,
    sendMessage: handleSend,
  };
}
