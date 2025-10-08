import { sendMessage } from '@/lib/api/message';
import { MessageInput } from '@/types/message';
import useSWRMutation from 'swr/mutation';

export function useMessage() {
  const { trigger, data, error, isMutating } = useSWRMutation(
    'message',
    // pass the function reference that accepts the file
    (key, { arg }: { arg: MessageInput }) => sendMessage(arg)
  );

  return {
    sendMessage: trigger,
    data, // backend response
    error,
    isLoading: isMutating,
  };
}
