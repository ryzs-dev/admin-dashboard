/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useSupabase.ts - Updated hooks for Supabase integration
import useSWR from "swr";
import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// ✅ FIXED: Updated interfaces to match normalized schema
export interface Order {
  id?: number;
  order_number?: string;
  customer_id: number;
  shipping_address_id?: number;
  order_date?: string;
  status?:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  subtotal?: number;
  postage?: number;
  website_charges?: number;
  total_amount: number; // ✅ FIXED: total_amount not total_paid
  currency?: string;
  payment_method?: string;
  payment_status?: "pending" | "paid" | "failed" | "refunded";
  cash_sale_receipt?: string;
  tracking_number?: string;
  courier_company?: string;
  shipment_description?: string;
  source?: string;
  agent_name?: string;
  notes?: string;
  remark?: string;
  created_at?: string;
  updated_at?: string;
  // Joined customer data
  customers?: {
    customer_name: string;
    phone_number: string;
    fb_name?: string;
    email?: string;
  };
  // Joined address data
  addresses?: {
    address_line_1: string;
    address_line_2?: string;
    city?: string;
    postcode?: string;
    state?: string;
  };
}

export interface OrderItem {
  id?: string; // Temporary ID for form management
  type: 'product' | 'package';
  item_id: number; // Product or Package ID
  item_name: string;
  item_code?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// ✅ NEW: Create Order Data Interface
export interface CreateOrderData {
  // Customer Information
  customer_name: string;
  phone_number: string;
  fb_name?: string;
  email?: string;
  customer_type?: 'new' | 'repeat';
  
  // Order Information
  total_amount: number;
  subtotal?: number;
  postage?: number;
  website_charges?: number;
  payment_method: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  currency?: string;
  source?: string;
  agent_name?: string;
  notes?: string;
  remark?: string;
  
  // Shipping Information
  address: string;
  address_line_2?: string;
  city?: string;
  postcode?: string;
  state?: string;
  country?: string;
  
  // Tracking Information
  tracking_number?: string;
  courier_company?: string;
  shipment_description?: string;
  
  // ✅ NEW: Order Items
  items?: OrderItem[];
}

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

// ✅ NEW: Hook for creating orders
export function useCreateOrder() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (orderData: CreateOrderData) => {
    setIsCreating(true);
    setError(null);

    try {
      // Transform order items for the API
      const transformedData = {
        ...orderData,
        order_items: orderData.items?.map(item => ({
          type: item.type,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }))
      };

      const response = await fetch(`${API_BASE_URL}/api/supabase/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to create order');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createOrder,
    isCreating,
    error,
    setError,
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
    searchKey
      ? `${API_BASE_URL}/api/supabase/orders/search?${searchKey}`
      : null,
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

// ✅ FIXED: Function to insert single order (updated for normalized schema)
export async function insertOrderToSupabase(order: Partial<Order>) {
  const response = await fetch(`${API_BASE_URL}/api/supabase/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer_name: order.customers?.customer_name || "Unknown",
      phone_number: order.customers?.phone_number,
      fb_name: order.customers?.fb_name,
      total_amount: order.total_amount || 0, // ✅ FIXED: total_amount
      payment_method: order.payment_method,
      source: order.source || "api",
      agent_name: order.agent_name,
      notes: order.notes,
      address: order.addresses?.address_line_1,
      city: order.addresses?.city,
      postcode: order.addresses?.postcode,
      state: order.addresses?.state,
      tracking_number: order.tracking_number,
      courier_company: order.courier_company,
      status: order.status || "pending",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to insert order");
  }

  return response.json();
}

// ✅ NEW: Simplified create order function that matches your API structure
export async function createOrderInSupabase(orderData: CreateOrderData) {
  const response = await fetch(`${API_BASE_URL}/api/supabase/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || "Failed to create order");
  }

  return response.json();
}

// ✅ FIXED: Function for bulk insert (updated for normalized schema)
export async function bulkInsertOrdersToSupabase(
  orders: Partial<Order>[],
  batchSize = 100
) {
  // Transform orders to the format expected by backend
  const transformedOrders = orders.map((order) => ({
    customer_name: order.customers?.customer_name || "Unknown",
    phone_number: order.customers?.phone_number,
    fb_name: order.customers?.fb_name,
    total_amount: order.total_amount || 0, // ✅ FIXED: total_amount
    payment_method: order.payment_method,
    source: order.source || "bulk_import",
    agent_name: order.agent_name,
    notes: order.notes,
    address: order.addresses?.address_line_1,
    city: order.addresses?.city,
    postcode: order.addresses?.postcode,
    state: order.addresses?.state,
    tracking_number: order.tracking_number,
    courier_company: order.courier_company,
    status: order.status || "pending",
  }));

  const response = await fetch(`${API_BASE_URL}/api/supabase/orders/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orders: transformedOrders, batchSize }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to bulk insert orders");
  }

  return response.json();
}

// Function to update an order
export async function updateOrderInSupabase(
  orderId: string | number,
  updates: Partial<Order>
) {
  const response = await fetch(
    `${API_BASE_URL}/api/supabase/orders/${orderId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to update order");
  }

  return response.json();
}

// Function to delete an order
export async function deleteOrderFromSupabase(orderId: string | number) {
  const response = await fetch(
    `${API_BASE_URL}/api/supabase/orders/${orderId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to delete order");
  }

  return response.json();
}

// ✅ FIXED: Function to sync August data specifically (updated for normalized schema)
export async function syncAugustDataToSupabase(augustData: any[]) {
  // Transform August data to match normalized schema expectations
  const transformedData = augustData.map((row: any) => ({
    customer_name: row.customer_name || row.name || row.fb_name || "Unknown",
    phone_number: row.phone_number || row.phone,
    fb_name: row.fb_name,
    total_amount: parseFloat(
      row.total_paid || row.total_amount || row.total || 0
    ), // ✅ FIXED
    payment_method: row.payment_method || row.paymentMethod,
    source: "august_migration",
    agent_name: row.agent_name || row.agent,
    notes: row.remark || row.notes,
    address: row.address,
    city: row.city,
    postcode: row.postcode,
    state: row.state,
    tracking_number: row.tracking_number || row.trackingNumber,
    courier_company: row.courier_company || row.courierCompany,
    status: row.status || "completed",
    order_date: row.order_date
      ? new Date(row.order_date).toISOString()
      : new Date().toISOString(),
  }));

  const response = await fetch(`${API_BASE_URL}/api/supabase/sync/august`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: transformedData }),
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

// ✅ NEW: Hook for customers (since we now have normalized schema)
export function useSupabaseCustomers(filters?: {
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const queryParams = new URLSearchParams();

  if (filters?.limit) queryParams.append("limit", filters.limit.toString());
  if (filters?.offset) queryParams.append("offset", filters.offset.toString());
  if (filters?.search) queryParams.append("search", filters.search);

  const { data, error, isLoading, mutate } = useSWR(
    `${API_BASE_URL}/api/supabase/customers?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  return {
    customers: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// ✅ NEW: Function to create customer
export async function createCustomerInSupabase(customerData: {
  customer_name: string;
  phone_number: string;
  fb_name?: string;
  email?: string;
  customer_type?: "new" | "repeat";
}) {
  const response = await fetch(`${API_BASE_URL}/api/supabase/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customerData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to create customer");
  }

  return response.json();
}