/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useSubscribers } from "@/hooks/useSubscribers";
import { useOrders } from "@/hooks/useOrders";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { StatsCards } from "@/components/dashboard/StatsCard";
import { ProductChart } from "@/components/dashboard/ProductTable";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import OrdersTable from "@/components/dashboard/OrdersTable";
import { FunnelGraph } from "@/components/subscribers/FunnelGraph";

export default function DashboardPage() {
  const {
    subscribers,
    loading: subsLoading,
    error: subsError,
  } = useSubscribers();
  const {
    orders,
    isLoading: ordersLoading,
    isError: ordersError,
  } = useOrders();

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/download-orders`
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orders-${new Date().toISOString()}.xlsx`;
      link.click();
    } catch (err) {
      console.error("❌ Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (subsLoading || ordersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (subsError || ordersError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        <p>⚠️ Failed to fetch dashboard data. Please check your backend.</p>
      </div>
    );
  }

  // 🧠 Funnel logic
  const funnelStageCounts = subscribers.reduce((acc, s) => {
    const stage = s.funnel_stage ?? 0;
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const avgOrderValue = totalRevenue / Math.max(orders.length, 1);
  const conversionRate =
    (orders.length / Math.max(subscribers.length, 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Lunaa Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Monitor customer journey and order performance
            </p>
          </div>

          <Button onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Orders
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <StatsCards
          stats={{
            totalOrders: orders.length,
            totalRevenue,
            avgOrderValue,
            funnelStages: funnelStageCounts,
            totalSubscribers: subscribers.length,
            conversionRate,
          }}
        />

        <Separator className="my-8" />

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="funnels">Funnels</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart orders={orders} />
              <ProductChart productCounts={aggregateProducts(orders)} />
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <OrdersTable orders={orders} />
          </TabsContent>

          <TabsContent value="funnels" className="mt-6">
            <FunnelGraph />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// 🔄 Aggregate product totals for chart
function aggregateProducts(orders: any[]): {
  wash120ml: number;
  femlift30ml: number;
  femlift10ml: number;
  spray: number;
  wash30ml: number;
} {
  const keys = ["wash120ml", "femlift30ml", "femlift10ml", "spray", "wash30ml"];

  return keys.reduce(
    (acc, key) => {
      acc[key as keyof typeof acc] = orders.reduce(
        (sum, o) => sum + (o[key] || 0),
        0
      );
      return acc;
    },
    {
      wash120ml: 0,
      femlift30ml: 0,
      femlift10ml: 0,
      spray: 0,
      wash30ml: 0,
    }
  );
}
