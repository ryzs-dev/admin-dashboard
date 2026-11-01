export type ReceiptCheckStatus =
  | 'pending'
  | 'match'
  | 'mismatch'
  | 'unreadable'
  | 'not_checked'
  | 'error';

export interface Receipt {
  id: string;
  order_id: string | null;
  wamid: string;
  sender_phone: string | null;
  caption: string | null;
  mime_type: string | null;
  received_at: string;
  check_status: ReceiptCheckStatus;
  amount: number | null;
  currency: string | null;
  paid_on: string | null;
  reference: string | null;
  bank: string | null;
  payer: string | null;
  check_note: string | null;
  checked_at: string | null;
  url: string | null;
}

// The summary embedded on each order row.
export type OrderReceiptSummary = Pick<Receipt, 'id' | 'check_status' | 'amount'>;

export type ReceiptModel = 'claude-opus-5-5' | 'claude-sonnet-5-5' | 'claude-haiku-5-5';

export interface ReceiptSettings {
  enabled: boolean;
  has_key: boolean;
  key_hint: string | null;
  model: ReceiptModel;
  monthly_cap_usd: number;
  month: { receipts_read: number; cost_usd: number };
  updated_at: string;
  updated_by: string | null;
}
