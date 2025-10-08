export interface MessageInput {
  direction: 'outbound';
  to_number: string;
  type: string;
  body: {
    tracking_number?: string;
    courier?: string;
    url?: string;
  };
  timestamp?: string;
  metadata?: [];
  created_at?: string;
  conversation_id?: string;
}
