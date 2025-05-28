// hooks/useApi.ts - Custom hooks to connect to your backend

import useSWR from "swr";
import { DashboardStats, Order, HealthCheck } from "@/types";

// Your backend base URL - update this to match your deployed backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Generic fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Custom hooks for each endpoint
export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    `${API_BASE_URL}/api/dashboard`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useHealthCheck() {
  const { data, error, isLoading } = useSWR<HealthCheck>(
    `${API_BASE_URL}/api/health`,
    fetcher,
    {
      refreshInterval: 60000, // Check health every minute
    }
  );

  return {
    health: data,
    isLoading,
    isError: error,
  };
}

export function useOrders() {
  const { data, error, isLoading, mutate } = useSWR<Order[]>(
    `${API_BASE_URL}/api/orders`, // You might need to create this endpoint
    fetcher,
    {
      refreshInterval: 10000, // Refresh every 10 seconds for real-time feel
    }
  );

  return {
    orders: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for downloading Excel report
export function useDownloadOrders() {
  const downloadOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/download-orders`);

      if (!response.ok) {
        throw new Error("Failed to download orders");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orders-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  };

  return { downloadOrders };
}

// Hook for real-time order updates (if you implement WebSocket)
export function useRealtimeOrders() {
  const { data: orders, mutate } = useSWR<Order[]>(
    `${API_BASE_URL}/api/orders`,
    fetcher
  );

  // You can add WebSocket connection here later
  // useEffect(() => {
  //   const ws = new WebSocket(`ws://localhost:3000/orders`);
  //   ws.onmessage = (event) => {
  //     const newOrder = JSON.parse(event.data);
  //     mutate(); // Refresh data when new order comes in
  //   };
  //   return () => ws.close();
  // }, [mutate]);

  return {
    orders: orders || [],
    refresh: mutate,
  };
}
