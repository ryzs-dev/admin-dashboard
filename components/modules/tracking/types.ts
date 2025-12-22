import { UUID } from 'crypto';
import { Courier } from './UpdateTrackingDialog';

export interface OrderTrackingInput {
  tracking_number: string;
  courier?: Courier;
  status: 'pending' | 'shipped' | 'delivered' | 'returned';
}

export interface OrderTracking extends OrderTrackingInput {
  id: UUID;
  created_at: string;
  updated_at: string;
  message_status: 'pending' | 'sent' | 'failed';
  last_message_sent_at?: string;
}
