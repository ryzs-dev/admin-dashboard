// app/orders/page.tsx - Complete Integrated Orders Page
"use client";

import { useState, useEffect } from "react";
import { 
  useSupabaseOrders, 
  useSupabaseOrderSearch
} from "@/hooks/useSupabase";
import { useCustomers } from "@/hooks/useCustomers";
import { useActiveProducts, useActivePackages } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Download, 
  RefreshCw, 
  ShoppingCart,
  Upload
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import SupabaseOrdersTable from "@/components/dashboard/SupabaseOrdersTable";
import { toast } from "sonner";
import { ImportButton } from "@/components/ImportButton";
import CreateOrderDialog from "@/components/order/CreateOrderDialog";

export default function OrdersPage() {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "august">("all");
  const [currencyFilter, setCurrencyFilter] = useState<"all" | "MYR" | "SGD">("all");
  const [statusFilter, setStatusFilter] = useState<
    | "all"
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded"
  >("all");
  const [currentPage, setCurrentPage] = useState(0);
  
  // Modal states
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  
  // Action states
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
  const { orders, pagination, isLoading, isError, refresh } = useSupabaseOrders({
    ...dateRange,
    currency: currencyFilter === "all" ? undefined : currencyFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  // Search functionality
  const { results: searchResults, isLoading: isSearching } = useSupabaseOrderSearch({
    q: searchQuery.length >= 3 ? searchQuery : undefined,
    limit: 50,
  });

  // Use search results if searching, otherwise use filtered orders
  const displayOrders = searchQuery.length >= 3 ? searchResults : orders;
  const displayLoading = searchQuery.length >= 3 ? isSearching : isLoading;

  // Handle page navigation
  const handlePageChange = (newPage: number) => {
    if (searchQuery.length >= 3) return;
    setCurrentPage(newPage);
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/supabase/export/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dateRange),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Orders exported successfully!');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast.error('Failed to export orders');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle import completion
  const handleImportComplete = () => {
    toast.success('Orders imported successfully!');
    refresh(); // Refresh the orders list
  };

  // Handle order creation success
  const handleOrderCreated = () => {
    toast.success('Order created successfully!');
    refresh(); // Refresh the orders list
    setIsCreateOrderOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders Management</h1>
          <p className="text-gray-600 mt-1">Manage and track customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export Button */}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </Button>
          
          {/* Import Button */}
          <ImportButton
            onImportComplete={handleImportComplete}
            variant="outline"
            className="flex items-center gap-2"
          />
          
          {/* Create Order Button */}
          <Button
            onClick={() => setIsCreateOrderOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <ShoppingCart className="h-4 w-4" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders, customers, tracking..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="august">August 2024</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={currencyFilter} onValueChange={(value: any) => setCurrencyFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              <SelectItem value="MYR">MYR</SelectItem>
              <SelectItem value="SGD">SGD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <SupabaseOrdersTable
        orders={displayOrders}
        isLoading={displayLoading}
        showPagination={searchQuery.length < 3}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      {/* Create Order Dialog */}
      <CreateOrderDialog 
        isOpen={isCreateOrderOpen} 
        onClose={() => setIsCreateOrderOpen(false)} 
        onSuccess={handleOrderCreated} 
      />
    </div>
  );
}