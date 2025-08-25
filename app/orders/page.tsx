/* eslint-disable @typescript-eslint/no-explicit-any */
// app/orders/page.tsx - Updated to use normalized Supabase schema
"use client";

import { useState } from "react";
import {
  useSupabaseOrders,
  useSupabaseOrderSearch,
  Order,
} from "@/hooks/useSupabase"; // ✅ FIXED: Import Order type
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, RefreshCw, Calendar } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import SupabaseOrdersTable from "@/components/dashboard/SupabaseOrdersTable";
import { ImportButton } from "@/components/ImportButton";

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month" | "august"
  >("all");
  const [currencyFilter, setCurrencyFilter] = useState<"all" | "MYR" | "SGD">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<
    | "all"
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded"
  >("all"); // ✅ FIXED: Updated status options
  const [currentPage, setCurrentPage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const pageSize = 50;

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "today":
        return {
          startDate: format(now, "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
        };
      case "week":
        return {
          startDate: format(subDays(now, 7), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
        };
      case "month":
        return {
          startDate: format(startOfMonth(now), "yyyy-MM-dd"),
          endDate: format(endOfMonth(now), "yyyy-MM-dd"),
        };
      case "august":
        return { month: 8 };
      default:
        return {};
    }
  };

  const dateRange = getDateRange();

  // Fetch orders with filters
  const { orders, pagination, isLoading, isError, refresh } = useSupabaseOrders(
    {
      ...dateRange,
      currency: currencyFilter === "all" ? undefined : currencyFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: pageSize,
      offset: currentPage * pageSize,
    }
  );

  // ✅ FIXED: Log orders to check structure with normalized schema
  console.log("📊 Orders from normalized schema:", orders);
  console.log("📄 Sample order structure:", orders?.[0]);

  // Search functionality
  const {
    results: searchResults,
    isLoading: isSearching,
    search,
  } = useSupabaseOrderSearch({
    q: searchQuery.length >= 3 ? searchQuery : undefined,
    limit: 50,
  });

  // Use search results if searching, otherwise use filtered orders
  const displayOrders = searchQuery.length >= 3 ? searchResults : orders;
  const displayLoading = searchQuery.length >= 3 ? isSearching : isLoading;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.length >= 3) {
      search();
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams();

      // Add current filters to export
      if (dateRange.startDate)
        queryParams.append("startDate", dateRange.startDate);
      if (dateRange.endDate) queryParams.append("endDate", dateRange.endDate);
      if (dateRange.month)
        queryParams.append("month", dateRange.month.toString());
      if (currencyFilter !== "all")
        queryParams.append("currency", currencyFilter);
      if (statusFilter !== "all") queryParams.append("status", statusFilter);

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/supabase/export/excel?${queryParams.toString()}`
      );

      if (!response.ok) throw new Error("Export failed");

      const data = await response.json();

      // ✅ FIXED: Create CSV with normalized schema fields
      const csvContent = convertToCSV(data.data);
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orders-${dateFilter}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // ✅ FIXED: Updated CSV conversion for normalized schema
  const convertToCSV = (data: Order[]) => {
    if (!data.length) return "";

    // Define headers for normalized schema
    const headers = [
      "Order ID",
      "Order Number",
      "Date",
      "Customer Name",
      "Phone Number",
      "FB Name",
      "Email",
      "Total Amount", // ✅ FIXED: total_amount not total_paid
      "Currency",
      "Status",
      "Payment Status",
      "Payment Method",
      "Tracking Number",
      "Courier Company",
      "Agent",
      "Address",
      "City",
      "State",
      "Postcode",
      "Notes",
    ];

    const csvHeaders = headers.join(",");
    const csvRows = data.map((order: Order) => {
      const values = [
        order.id || "",
        order.order_number || "",
        order.order_date
          ? format(new Date(order.order_date), "yyyy-MM-dd")
          : "",
        order.customers?.customer_name || "", // ✅ FIXED: Access through customers object
        order.customers?.phone_number || "",
        order.customers?.fb_name || "",
        order.customers?.email || "",
        order.total_amount || 0, // ✅ FIXED: total_amount
        order.currency || "",
        order.status || "",
        order.payment_status || "",
        order.payment_method || "",
        order.tracking_number || "",
        order.courier_company || "",
        order.agent_name || "",
        order.addresses?.address_line_1 || "", // ✅ FIXED: Access through addresses object
        order.addresses?.city || "",
        order.addresses?.state || "",
        order.addresses?.postcode || "",
        order.notes || order.remark || "",
      ];

      return values
        .map((value) => {
          // Escape commas and quotes in CSV values
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",");
    });

    return [csvHeaders, ...csvRows].join("\n");
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">
            ⚠️ Failed to load orders
          </div>
          <p className="text-gray-600 mb-4">
            Make sure your backend is running and Supabase is configured
            correctly.
          </p>
          <Button onClick={refresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage and track all orders from Supabase (Normalized Schema)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={refresh}
                variant="outline"
                size="sm"
                disabled={displayLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    displayLoading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>

              <ImportButton />
              <Button onClick={handleExport} disabled={isExporting} size="sm">
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search customers, phone, tracking, order number..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
              {searchQuery.length > 0 && searchQuery.length < 3 && (
                <p className="text-xs text-gray-500 mt-1">
                  Type at least 3 characters to search
                </p>
              )}
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value as any);
                  setCurrentPage(0);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="august">August 2024</option>
              </select>
            </div>

            {/* Currency Filter */}
            <div>
              <select
                value={currencyFilter}
                onChange={(e) => {
                  setCurrencyFilter(e.target.value as any);
                  setCurrentPage(0);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">All Currencies</option>
                <option value="MYR">MYR</option>
                <option value="SGD">SGD</option>
              </select>
            </div>

            {/* ✅ FIXED: Status Filter with normalized schema statuses */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(0);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(dateFilter !== "all" ||
            currencyFilter !== "all" ||
            statusFilter !== "all" ||
            searchQuery) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {dateFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Calendar className="h-3 w-3" />
                  {dateFilter}
                  <button
                    onClick={() => setDateFilter("all")}
                    className="ml-1 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {currencyFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {currencyFilter}
                  <button
                    onClick={() => setCurrencyFilter("all")}
                    className="ml-1 hover:text-green-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {statusFilter}
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="ml-1 hover:text-yellow-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <Search className="h-3 w-3" />
                  &quot;{searchQuery}&quot;
                  <button
                    onClick={clearSearch}
                    className="ml-1 hover:text-purple-600"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              {searchQuery.length >= 3 ? (
                <span>Search results: {searchResults.length} orders found</span>
              ) : (
                <span>
                  Showing {displayOrders.length} orders
                  {pagination &&
                    ` (${pagination.offset + 1}-${Math.min(
                      pagination.offset + pagination.limit,
                      pagination.total
                    )} of ${pagination.total})`}
                </span>
              )}
            </div>
            {!searchQuery && pagination && pagination.total > pageSize && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <span className="text-xs">
                  Page {currentPage + 1} of{" "}
                  {Math.ceil(pagination.total / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={
                    pagination.offset + pagination.limit >= pagination.total
                  }
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow">
          <SupabaseOrdersTable
            orders={displayOrders}
            isLoading={displayLoading}
            showPagination={false} // We handle pagination above
          />
        </div>

        {/* ✅ NEW: Debug Information (Remove in production) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 bg-gray-100 rounded-lg p-4">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                🔍 Debug Information (Development Only)
              </summary>
              <div className="text-xs text-gray-600 space-y-2">
                <div>
                  <strong>Orders Count:</strong> {displayOrders.length}
                </div>
                <div>
                  <strong>Is Loading:</strong> {displayLoading ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Is Error:</strong> {isError ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Search Query:</strong> {searchQuery || "None"}
                </div>
                <div>
                  <strong>Active Filters:</strong> Date: {dateFilter}, Currency:{" "}
                  {currencyFilter}, Status: {statusFilter}
                </div>
                {pagination && (
                  <div>
                    <strong>Pagination:</strong> {pagination.offset + 1}-
                    {Math.min(
                      pagination.offset + pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total}
                  </div>
                )}
                {displayOrders[0] && (
                  <div>
                    <strong>Sample Order Structure:</strong>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(displayOrders[0], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
