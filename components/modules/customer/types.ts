import { UUID } from 'crypto';

export interface Customer {
  id: UUID;
  name: string;
  email: string;
  fb_name?: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  total_amount_spent: number;
  total_purchase_count: number;
  has_recent_purchase: boolean;
  last_order_date?: string;
  repeat_customer: 'returning' | 'new';
}

export interface Query {
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: FilterType;
}

export type FilterType = 'all' | 'today' | 'week' | 'month';

export interface Address {
  id: UUID;
  full_address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}
