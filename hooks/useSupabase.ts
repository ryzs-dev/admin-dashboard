// hooks/useSupabase.ts - Updated hooks for Supabase integration
import useSWR from "swr";
import { Order } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Interface for order filters
interface OrderFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  currency?: string;
  limit?: number;
  offset?: number;
  month?: number; // For filtering by specific month (1-12)
}

// Interface for search parameters
interface SearchParams {
  q?: string;
  phone?: string;
  trackingNumber?: string;
  customerName?: string;
  limit?: number;
}

// Hook for fetching orders from Supabase
export function useSupabaseOrders(filters?: OrderFilters) {
  const queryParams = new URLSearchParams();
  
  if (filters?.startDate) queryParams.append("startDate", filters.startDate);
  if (filters?.endDate) queryParams.append("endDate", filters.endDate);
  if (filters?.status) queryParams.append("status", filters.status);
  if (filters?.currency) queryParams.append("currency", filters.currency);
  if (filters?.limit) queryParams.append("limit", filters.limit.toString());
  if (filters?.offset) queryParams.append("offset", filters.offset.toString());
  if (filters?.month) queryParams.append("month", filters.month.toString());

  const { data, error, isLoading, mutate } = useSWR(
    `${API_BASE_URL}/api/supabase/orders?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  return {
    orders: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for dashboard stats from Supabase
export function useSupabaseDashboardStats(filters?: {
  startDate?: string;
  endDate?: string;
  month?: number;
}) {
  const queryParams = new URLSearchParams();
  
  if (filters?.startDate) queryParams.append("startDate", filters.startDate);
  if (filters?.endDate) queryParams.append("endDate", filters.endDate);
  if (filters?.month) queryParams.append("month", filters.month.toString());

  const { data, error, isLoading, mutate } = useSWR(
    `${API_BASE_URL}/api/supabase/dashboard-stats?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 30000,
    }
  );

  return {
    stats: data?.data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for searching orders
export function useSupabaseOrderSearch(searchParams: SearchParams) {
  const queryParams = new URLSearchParams();
  
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString());
    }
  });

  const searchKey = queryParams.toString();

  const { data, error, isLoading, mutate } = useSWR(
    searchKey ? `${API_BASE_URL}/api/supabase/orders/search?${searchKey}` : null,
    fetcher,
    {
      // Don't refresh automatically for search results
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );

  return {
    results: data?.data || [],
    count: data?.count || 0,
    isLoading,
    isError: error,
    search: mutate,
  };
}

// Hook for getting a single order
export function useSupabaseOrder(orderId?: string | number) {
  const { data, error, isLoading, mutate } = useSWR(
    orderId ? `${API_BASE_URL}/api/supabase/orders/${orderId}` : null,
    fetcher
  );

  return {
    order: data?.data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for Supabase health check
export function useSupabaseHealth() {
  const { data, error, isLoading } = useSWR(
    `${API_BASE_URL}/api/supabase/health`,
    fetcher,
    {
      refreshInterval: 60000, // Check every minute
    }
  );

  return {
    health: data?.data,
    isHealthy: data?.success === true,
    isLoading,
    isError: error,
  };
}

// Function to insert single order
export async function insertOrderToSupabase(order: Order) {
  const response = await fetch(`${API_BASE_URL}/api/supabase/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to insert order");
  }

  return response.json();
}

// Function for bulk insert (for data migration)
export async function bulkInsertOrdersToSupabase(orders: Order[], batchSize = 100) {
  const response = await fetch(`${API_BASE_URL}/api/supabase/orders/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orders, batchSize }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to bulk insert orders");
  }

  return response.json();
}

// Function to update an order
export async function updateOrderInSupabase(orderId: string | number, updates: Partial<Order>) {
  const response = await fetch(`${API_BASE_URL}/api/supabase/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to update order");
  }

  return response.json();
}

// Function to delete an order
export async function deleteOrderFromSupabase(orderId: string | number) {
  const response = await fetch(`${API_BASE_URL}/api/supabase/orders/${orderId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to delete order");
  }

  return response.json();
}

// Function to sync August data specifically
export async function syncAugustDataToSupabase(augustData: any[]) {
  const response = await fetch(`${API_BASE_URL}/api/supabase/sync/august`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: augustData }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to sync August data");
  }

  return response.json();
}

// Function to export data to Excel
export async function exportSupabaseDataToExcel(filters?: {
  startDate?: string;
  endDate?: string;
  month?: number;
}) {
  const queryParams = new URLSearchParams();
  
  if (filters?.startDate) queryParams.append("startDate", filters.startDate);
  if (filters?.endDate) queryParams.append("endDate", filters.endDate);
  if (filters?.month) queryParams.append("month", filters.month.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/supabase/export/excel?${queryParams.toString()}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to export data");
  }

  return response.json();
}

// Hook for August data specifically (useful for your immediate needs)
export function useAugustOrders() {
  return useSupabaseOrders({ month: 8 }); // August is month 8
}

// Hook for August dashboard stats
export function useAugustDashboardStats() {
  return useSupabaseDashboardStats({ month: 8 });
}