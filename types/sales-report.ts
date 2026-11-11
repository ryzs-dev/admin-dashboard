export type SalesReportRow = {
  ad_spend: number;
  messages: number;
  // Comments people left on the ads that day.
  ad_comments: number;
  wa_orders: number;
  wa_new: number;
  wa_repeat: number;
  wa_sales: number;
  distributor_orders: number;
  distributor_sales: number;
  shopee_orders: number;
  lazada_orders: number;
  mp_new: number;
  mp_repeat: number;
  mp_sales: number;
  orders: number;
  sales: number;
  marketplace_orders: number;
  cost_per_message: number | null;
  repeat_pct: number | null;
  mp_repeat_pct: number | null;
  cost_per_conversion: number | null;
  conversion_rate: number | null;
  roas: number | null;
  aov: number | null;
};

export type SalesReport = {
  month: string;
  from: string;
  to: string;
  ad_account: { id: string; name: string | null; currency: string | null } | null;
  target: number | null;
  to_pick_up: number | null;
  days_left: number;
  sales_per_day_needed: number | null;
  totals: SalesReportRow;
  days: (SalesReportRow & { date: string })[];
};
