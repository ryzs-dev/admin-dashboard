import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

export function useChatSocket(
  conversationId: string,
  onMessage: (msg: any) => void
) {
  const socketRef = useRef<typeof Socket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!conversationId) return;

    const socket = io(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    );
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected:', socket.id);
      socket.emit('join_room', conversationId);
    });

    socket.on('new_message', (msg: any) => {
      console.log('🔔 new_message received:', msg);
      console.log(
        '🔔 msg.conversation_id:',
        msg.conversation_id,
        'current:',
        conversationId
      );
      console.log('🔔 match?', msg.conversation_id === conversationId);
      if (msg.conversation_id === conversationId) {
        onMessageRef.current(msg);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [conversationId]); // no onMessage dep
}
