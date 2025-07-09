// types/index.ts - TypeScript definitions for your backend data

// types.ts
export interface Order {
  order_id: string;
  order_date: string;
  fb_name?: string;
  name: string;
  paymentMethod: string;
  wash120ml: number;
  femlift30ml: number;
  femlift10ml: number;
  wash30ml: number;
  spray: number;
  remark?: string;
  package_type: string;
  packageAmount: string;
  postage?: string;
  websiteCharges?: string;
  total: number;
  packageDescription?: string;
  address: string;
  city?: string;
  postcode?: string;
  state?: string;
  phone: string;
  trackingNumber?: string;
  courierCompany?: string;
  customerType: string;
  cashSaleReceipt?: string;
  agent: string;
  currency?: string;
}

export interface Subscriber {
  psid: string;
  created_at: number;
  last_interaction: number;
  source: string;
  sequence_step: number;
  last_sent: number | null;
  next_send_time: number | null;
  funnel_stage: number | null;
}

export interface FunnelStageStat {
  funnel_stage: number | null;
  count: number;
}

export type DashboardStats = {
  totalOrders: number;

  totalRevenue: number;

  avgOrderValue: number;

  totalSubscribers: number;

  conversionRate: number;

  funnelStages: Record<number, number>;
};

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  orders: number;
  uptime: number;
}

// Product interface for potential future use
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}
