import { UUID } from 'crypto';
import { Address, Customer } from '../customer/types';
import { OrderTracking } from '../tracking/types';

export interface Order {
  id: UUID;
  customer_id: UUID;
  order_number: string;
  addresses?: Address;
  customers?: Customer;
  order_date: string;
  status: 'unpaid' | 'paid' | 'refunded';
  total_amount: number;
  payment_method: string;
  order_items: OrderItems[];
  order_tracking?: OrderTracking;
  created_at: string;
  updated_at: string;
  shipment_description?: string;
  source?: OrderSource;
  buyer_name?: string | null;
  agent_name?: string | null;
}

export type OrderSource = 'whatsapp' | 'shopee' | 'lazada';

export const MARKETPLACE_LABELS: Partial<Record<OrderSource, string>> = {
  shopee: 'Shopee',
  lazada: 'Lazada',
};

export const isMarketplaceOrder = (order: { source?: string | null }) =>
  order.source === 'shopee' || order.source === 'lazada';

export interface OrderItems {
  id: UUID;
  order_id: string;
  product_id: string;
  quantity: number;
  products: {
    id: UUID;
    code: string;
    name: string;
    price: number;
  };
}
