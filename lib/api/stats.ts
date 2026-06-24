import axios from 'axios';
import {
  DashboardStatsDTO,
  ProductMonthlyTrendDTO,
  ProductPerformanceDTO,
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
    charts: {
      revenue: { label: string; value: number }[];
      customer_acquisition: { month: string; new_customers: number }[];
    };
  };
}

export async function getProductPerformance(month: string) {
  const { data } = await api.get(`/products?month=${month}`);
  return data as {
    products: ProductPerformanceDTO[];
  };
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
