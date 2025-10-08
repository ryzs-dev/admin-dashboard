import { UUID } from 'crypto';

export interface OrderInput {
  customer_id: UUID;
  order_date: Date;
  status: string;
  total_amount: number;
  payment_method: string;
  order_items: OrderItemsInput[];
}

export interface OrderItemsInput {
  product_id: UUID;
  quantity: number;
}
