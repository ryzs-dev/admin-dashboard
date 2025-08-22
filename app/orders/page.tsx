// app/orders/page.tsx - Updated to use Supabase hooks
"use client";

import { useState } from "react";
import { useSupabaseOrders, useSupabaseOrderSearch } from "@/hooks/useSupabase";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Calendar,
  ArrowUpDown
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import SupabaseOrdersTable from "@/components/dashboard/SupabaseOrdersTable";
import { ImportButton } from "@/components/ImportButton";

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'august'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'MYR' | 'SGD'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const pageSize = 50;

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return {
          startDate: format(now, 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd')
        };
      case 'week':
        return {
          startDate: format(subDays(now, 7), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd')
        };
      case 'month':
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      case 'august':
        return { month: 8 };
      default:
        return {};
    }
  };

  const dateRange = getDateRange();

  // Fetch orders with filters
  const { 
    orders, 
    pagination,
    isLoading, 
    isError,
    refresh 
  } = useSupabaseOrders({
    ...dateRange,
    currency: currencyFilter === 'all' ? undefined : currencyFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: pageSize,
    offset: currentPage * pageSize
  });

  // Search functionality
  const { 
    results: searchResults, 
    isLoading: isSearching,
    search 
  } = useSupabaseOrderSearch({
    q: searchQuery.length >= 3 ? searchQuery : undefined,
    limit: 50
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
      if (dateRange.startDate) queryParams.append('startDate', dateRange.startDate);
      if (dateRange.endDate) queryParams.append('endDate', dateRange.endDate);
      if (dateRange.month) queryParams.append('month', dateRange.month.toString());
      if (currencyFilter !== 'all') queryParams.append('currency', currencyFilter);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/supabase/export/excel?${queryParams.toString()}`
      );
      
      if (!response.ok) throw new Error('Export failed');
      
      const data = await response.json();
      
      // Create and download CSV file
      const csvContent = convertToCSV(data.data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
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
          <div className="text-red-600 text-lg mb-4">⚠️ Failed to load orders</div>
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
                Manage and track all orders from Supabase
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={refresh} 
                variant="outline" 
                size="sm"
                disabled={displayLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${displayLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <ImportButton/>
              <Button 
                onClick={handleExport}
                disabled={isExporting}
                size="sm"
              >
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
                  placeholder="Search customers, phone, tracking..."
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
                <p className="text-xs text-gray-500 mt-1">Type at least 3 characters to search</p>
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

            {/* Status Filter */}
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
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(dateFilter !== 'all' || currencyFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {dateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Calendar className="h-3 w-3" />
                  {dateFilter}
                  <button onClick={() => setDateFilter('all')} className="ml-1 hover:text-blue-600">×</button>
                </span>
              )}
              {currencyFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {currencyFilter}
                  <button onClick={() => setCurrencyFilter('all')} className="ml-1 hover:text-green-600">×</button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {statusFilter}
                  <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-yellow-600">×</button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <Search className="h-3 w-3" />
                  "{searchQuery}"
                  <button onClick={clearSearch} className="ml-1 hover:text-purple-600">×</button>
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
                  {pagination && ` (${pagination.offset + 1}-${Math.min(pagination.offset + pagination.limit, pagination.total)} of ${pagination.total})`}
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
                  Page {currentPage + 1} of {Math.ceil(pagination.total / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
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
      </div>
    </div>
  );
}