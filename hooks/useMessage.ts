import { sendMessage, sendTrackingInfo } from '@/lib/api/message';
import { MessageInput } from '@/types/message';
import useSWRMutation from 'swr/mutation';

export function useMessage() {
  const { trigger, data, error, isMutating } = useSWRMutation(
    'message',
    // pass the function reference that accepts the file
    (key, { arg }: { arg: MessageInput }) => sendMessage(arg)
  );

  return {
    sendTrackingInfo: (data: any) => sendTrackingInfo(data),
    sendMessage: trigger,
    data, // backend response
    error,
    isLoading: isMutating,
  };
}
