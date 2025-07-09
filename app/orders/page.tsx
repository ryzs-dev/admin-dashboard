// app/orders/page.tsx
"use client";

import { useOrders } from "@/hooks/useOrders";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import OrdersTable from "@/components/dashboard/OrdersTable";

export default function OrdersPage() {
  const { orders, isLoading, isError } = useOrders();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        ⚠️ Failed to load orders.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">All Orders</h1>
      <OrdersTable orders={orders} />
    </div>
  );
}
