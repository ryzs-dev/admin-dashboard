export interface DashboardStatsDTO {
  total_customers: number;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  mtd_revenue: number;
}

export type SalesChannel = 'whatsapp' | 'shopee' | 'lazada';

export type ChannelTotalsDTO = Record<
  SalesChannel,
  { orders: number; revenue: number }
>;

export const EMPTY_CHANNEL_TOTALS: ChannelTotalsDTO = {
  whatsapp: { orders: 0, revenue: 0 },
  shopee: { orders: 0, revenue: 0 },
  lazada: { orders: 0, revenue: 0 },
};

export interface RepeatOrderValueDTO {
  repeat_customers: number;
  repeat_orders: number;
  repeat_revenue: number;
  repeat_average_order_value: number;
  repeat_revenue_share: number;
  new_orders: number;
  new_revenue: number;
  new_average_order_value: number;
}

export type RevenueTrend = 'increasing' | 'stable' | 'decreasing';

export interface ProductPerformanceDTO {
  product_id: string;
  product_name: string;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  quantity_sold: number;
  unique_customers: number;
  repeat_customers: number;
  repeat_customer_rate: number;
  customer_lifetime_value: number;
  previous_month_revenue: number;
  revenue_trend: RevenueTrend;
}

export interface ProductMonthlyTrendDTO {
  month_label: string;
  month_start: string;
  revenue: number;
  quantity_sold: number;
  total_orders: number;
  first_time_buyers: number;
  returning_buyers: number;
  repeat_customer_rate: number;
}

export const EMPTY_DASHBOARD_STATS: DashboardStatsDTO = {
  total_customers: 0,
  total_orders: 0,
  total_revenue: 0,
  average_order_value: 0,
  mtd_revenue: 0,
};

export const EMPTY_REPEAT_ORDER_VALUE: RepeatOrderValueDTO = {
  repeat_customers: 0,
  repeat_orders: 0,
  repeat_revenue: 0,
  repeat_average_order_value: 0,
  repeat_revenue_share: 0,
  new_orders: 0,
  new_revenue: 0,
  new_average_order_value: 0,
};
