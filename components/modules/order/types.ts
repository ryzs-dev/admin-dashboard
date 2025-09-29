import { UUID } from "crypto";
import { Address, Customer } from "../customer/types";
import { OrderTracking } from "../tracking/types";

export interface Order {
  id: UUID;
  customer_id: UUID;
  addresses?: Address;
  customers?: Customer;
  order_date: string;
  status: "unpaid" | "paid" | "refunded";
  total_amount: number;
  payment_method: string;
  order_items: OrderItems[];
  order_tracking?: OrderTracking[];
  created_at: string;
  updated_at: string;
}

export interface OrderItems {
  id: UUID;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: {
    id: UUID;
    name: string;
    price: number;
    created_at: string;
  };
}
