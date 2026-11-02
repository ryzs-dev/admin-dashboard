import axios from 'axios';
import { SalesReport } from '@/types/sales-report';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/sales-report`,
  headers: { 'Content-Type': 'application/json' },
});

function apiError(error: unknown, fallback: string) {
  const body = axios.isAxiosError(error) ? error.response?.data : undefined;
  return new Error(body?.message || fallback);
}

export async function getSalesReport(month: string) {
  try {
    const { data } = await api.get('/', { params: { month } });
    return data as SalesReport;
  } catch (error) {
    throw apiError(error, 'Couldn’t load the sales report');
  }
}

export async function saveSalesTarget(month: string, target: number | null) {
  try {
    const { data } = await api.put('/target', { month, target });
    return data as SalesReport;
  } catch (error) {
    throw apiError(error, 'Couldn’t save the target');
  }
}

export async function downloadSalesReport(month: string) {
  let response;
  try {
    response = await api.get<Blob>('/export', { params: { month }, responseType: 'blob' });
  } catch (error) {
    const blob = axios.isAxiosError(error) ? (error.response?.data as Blob | undefined) : undefined;
    const text = blob ? await blob.text().catch(() => '') : '';
    let message = 'Couldn’t build the Excel file';
    try {
      message = JSON.parse(text).message || message;
    } catch {}
    throw new Error(message);
  }
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lunaa-sales-report-${month}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
