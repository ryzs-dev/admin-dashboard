import { UUID } from 'crypto';

export interface Distributor {
  id: UUID;
  name: string | null;
  phone_number: string;
  notes: string | null;
  created_at: string;
  order_count: number;
}

export interface DistributorInput {
  name?: string;
  phone_number: string;
  notes?: string;
}
