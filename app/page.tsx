// app/page.tsx - Main Dashboard Page

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  RefreshCw,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Clock,
} from "lucide-react";

import {
  useDashboardStats,
  useHealthCheck,
  useDownloadOrders,
} from "@/hooks/useApi";

import { format } from "date-fns";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { ProductChart } from "@/components/dashboard/ProductTable";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { StatsCards } from "@/components/dashboard/StatsCard";

export default function Dashboard() {
  const {
    stats,
    isLoading: statsLoading,
    isError: statsError,
    refresh,
  } = useDashboardStats();
  const { health } = useHealthCheck();
  const { downloadOrders } = useDownloadOrders();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadOrders();
    } catch (error) {
      console.error("Download failed:", error);
      // You could add a toast notification here
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRefresh = () => {
    refresh();
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Connection Error</CardTitle>
            <CardDescription>
              Unable to connect to your backend server. Please ensure your
              server is running.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                E-commerce Dashboard
              </h1>
              <p className="text-gray-600">
                Monitor your automated order processing system
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Server Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    health?.status === "OK" ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {health?.status === "OK" ? "Server Online" : "Server Offline"}
                </span>
              </div>

              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>

              <Button onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export Excel
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <StatsCards stats={stats} />

        <Separator className="my-8" />

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart orders={stats?.recentOrders || []} />
              <ProductChart productCounts={stats?.productCounts} />
            </div>

            {/* Recent Orders Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Latest {stats?.recentOrders?.length || 0} orders from all
                  channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentOrders?.slice(0, 5).map((order, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-gray-600">
                            Order #{order.orderNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">RM {order.total}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(order.orderDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <OrdersTable orders={stats?.recentOrders || []} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Order Value
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    RM{" "}
                    {(
                      parseFloat(stats?.totalRevenue || "0") /
                      Math.max(stats?.totalOrders || 1, 1)
                    ).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per order average
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conversion Rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">85.2%</div>
                  <p className="text-xs text-muted-foreground">
                    Messages to orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Response Time
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">32s</div>
                  <p className="text-xs text-muted-foreground">
                    Average response time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Customer Satisfaction
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">96%</div>
                  <p className="text-xs text-muted-foreground">
                    Positive feedback
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart orders={stats?.recentOrders || []} />
              <ProductChart productCounts={stats?.productCounts} />
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(stats?.productCounts || {}).map(
                ([product, count]) => (
                  <Card key={product}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium capitalize">
                        {product.replace(/([A-Z])/g, " $1").trim()}
                      </CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{count}</div>
                      <p className="text-xs text-muted-foreground">
                        Total sold
                      </p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductChart productCounts={stats?.productCounts} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
