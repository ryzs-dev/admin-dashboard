// hooks/useCustomers.ts - Customer Management Hooks
import useSWR from "swr";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// ============================================================================
// INTERFACES
// ============================================================================

export interface Customer {
  id?: number;
  customer_name: string;
  phone_number: string;
  fb_name?: string;
  email?: string;
  customer_type?: 'new' | 'repeat';
  preferred_language?: 'en' | 'ms' | 'zh';
  notes?: string;
  total_orders?: number;
  total_spent?: number;
  average_order_value?: number;
  last_order_date?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  addresses?: Address[];
  orders?: Order[];
}

export interface Address {
  id?: number;
  customer_id: number;
  address_line_1: string;
  address_line_2?: string;
  city?: string;
  postcode?: string;
  state?: string;
  country?: string;
  address_type?: 'shipping' | 'billing' | 'both';
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id?: number;
  order_number?: string;
  customer_id: number;
  total_amount: number;
  order_date?: string;
  status?: string;
  payment_method?: string;
  created_at?: string;
}

interface CustomerFilters {
  search?: string;
  customer_type?: 'new' | 'repeat' | 'all';
  sort_by?: 'customer_name' | 'created_at' | 'last_order_date' | 'total_spent';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ============================================================================
// CUSTOMER HOOKS
// ============================================================================

// Hook for fetching customers
export function useCustomers(filters?: CustomerFilters) {
  const queryParams = new URLSearchParams();
  
  if (filters?.search) queryParams.append("search", filters.search);
  if (filters?.customer_type && filters.customer_type !== 'all') {
    queryParams.append("customer_type", filters.customer_type);
  }
  if (filters?.sort_by) queryParams.append("sort_by", filters.sort_by);
  if (filters?.sort_order) queryParams.append("sort_order", filters.sort_order);
  if (filters?.limit) queryParams.append("limit", filters.limit.toString());
  if (filters?.offset) queryParams.append("offset", filters.offset.toString());

  const { data, error, isLoading, mutate } = useSWR(
    `${API_BASE_URL}/api/customers?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
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

// Hook for getting a single customer
export function useCustomer(customerId?: string | number) {
  const { data, error, isLoading, mutate } = useSWR(
    customerId ? `${API_BASE_URL}/api/customers/${customerId}` : null,
    fetcher
  );

  return {
    customer: data?.data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for customer statistics
export function useCustomerStats(period = '30') {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_BASE_URL}/api/customers/stats/overview?period=${period}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
    }
  );

  return {
    stats: data?.data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for searching customer by phone
export function useCustomerByPhone(phoneNumber?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    phoneNumber ? `${API_BASE_URL}/api/customers/search/phone/${encodeURIComponent(phoneNumber)}` : null,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );

  return {
    customer: data?.data,
    isLoading,
    isError: error,
    search: mutate,
  };
}

// ============================================================================
// MUTATION FUNCTIONS
// ============================================================================

// Update customer
export async function updateCustomer(customerId: string | number, updates: Partial<Customer>) {
  const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to update customer");
  }

  return response.json();
}

// Add address to customer
export async function addCustomerAddress(customerId: string | number, addressData: Omit<Address, 'id' | 'customer_id' | 'created_at' | 'updated_at'>) {
  const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(addressData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to add address");
  }

  return response.json();
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

// Hook for recent customers (last 30 days)
export function useRecentCustomers() {
  return useCustomers({ 
    sort_by: 'created_at', 
    sort_order: 'desc', 
    limit: 50 
  });
}

// Hook for top customers by spending
export function useTopCustomers(limit = 20) {
  return useCustomers({ 
    sort_by: 'total_spent', 
    sort_order: 'desc', 
    limit 
  });
}

// Hook for customers with recent orders
export function useActiveCustomers() {
  return useCustomers({ 
    sort_by: 'last_order_date', 
    sort_order: 'desc', 
    limit: 50 
  });
}