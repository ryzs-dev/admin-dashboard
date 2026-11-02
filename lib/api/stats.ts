import axios from 'axios';
import {
  ChannelTotalsDTO,
  CustomerMixDTO,
  DailyBreakdownDTO,
  DashboardStatsDTO,
  ProductMonthlyTrendDTO,
  ProductPerformanceDTO,
  RepeatOrderValueDTO,
} from '@/types/stats';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/stats`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getDashboardStats(month: string) {
  const { data } = await api.get(`/dashboard?month=${month}`);
  return data as {
    stats: DashboardStatsDTO;
    repeat_order_value?: RepeatOrderValueDTO;
    channels?: ChannelTotalsDTO;
    charts: {
      revenue: { label: string; value: number }[];
      customer_acquisition: { month: string; new_customers: number }[];
    };
  };
}

export async function getDailyBreakdown(month: string) {
  const { data } = await api.get(`/daily?month=${month}`);
  return data as { days: DailyBreakdownDTO[]; totals: CustomerMixDTO };
}

export async function getProductPerformance(month: string) {
  const { data } = await api.get(`/products?month=${month}`);
  return data as {
    products: ProductPerformanceDTO[];
  };
}

export async function downloadMonthExport(month: string) {
  const { data } = await api.get<Blob>('/export', {
    params: { month },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lunaa-sales-${month}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export type ReportRequest = {
  period: 'day' | 'month';
  month: string;
  date: string;
  sections: ('summary' | 'daily' | 'orders' | 'products' | 'new_customers' | 'returning_customers' | 'ads')[];
  columns: string[];
  format: 'xlsx' | 'csv';
};

export async function downloadReport(req: ReportRequest) {
  let response;
  try {
    response = await api.get<Blob>('/report', {
      params: {
        period: req.period,
        ...(req.period === 'day' ? { date: req.date } : { month: req.month }),
        sections: req.sections.join(','),
        columns: req.columns.join(','),
        format: req.format,
      },
      responseType: 'blob',
    });
  } catch (error) {
    // The error body arrives as a Blob too; read the server's reason out of it.
    const blob = axios.isAxiosError(error) ? (error.response?.data as Blob | undefined) : undefined;
    const text = blob ? await blob.text().catch(() => '') : '';
    let message = 'Couldn’t build the report';
    try {
      message = JSON.parse(text).message || message;
    } catch {}
    throw new Error(message);
  }
  const label = req.period === 'day' ? req.date : req.month;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lunaa-report-${label}.${req.format}`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function getProductMonthlyTrends(
  productId: string,
  month: string,
  monthsBack = 6
) {
  const { data } = await api.get(
    `/products/${productId}?month=${month}&monthsBack=${monthsBack}`
  );
  return data as {
    trends: ProductMonthlyTrendDTO[];
  };
}
