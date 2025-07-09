"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Filter, Calendar, DollarSign } from "lucide-react";
import { Order } from "@/types";

interface Props {
  orders: Order[];
}

export default function OrdersTable({ orders = [] }: Props) {
  const [currencyFilter, setCurrencyFilter] = useState<string>("All");
  const [dateFilter, setDateFilter] = useState<string>("All");

  // Helper function to get date ranges
  const getDateRanges = () => {
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const startOfYear = new Date(today.getFullYear(), 0, 1);

    return {
      today: startOfToday,
      week: startOfWeek,
      month: startOfMonth,
      year: startOfYear,
    };
  };

  // Get unique dates for specific date filtering
  const uniqueDates = useMemo(() => {
    const dates = orders.map((order) => ({
      display: new Date(order.order_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      value: new Date(order.order_date).toDateString(),
    }));

    // Remove duplicates and sort
    const uniqueValues = Array.from(
      new Map(dates.map((d) => [d.value, d])).values()
    );

    return uniqueValues.sort(
      (a, b) => new Date(b.value).getTime() - new Date(a.value).getTime()
    );
  }, [orders]);

  // Filter orders based on selected currency and date
  const filteredOrders = orders.filter((order) => {
    const currencyMatch =
      currencyFilter === "All" || order.currency === currencyFilter;

    if (!currencyMatch) return false;

    const orderDate = new Date(order.order_date);
    const ranges = getDateRanges();

    switch (dateFilter) {
      case "Today":
        return orderDate >= ranges.today;
      case "This Week":
        return orderDate >= ranges.week;
      case "This Month":
        return orderDate >= ranges.month;
      case "This Year":
        return orderDate >= ranges.year;
      case "All":
        return true;
      default:
        // Check if it's a specific date
        return orderDate.toDateString() === dateFilter;
    }
  });

  // Calculate total revenue by currency
  const revenueStats = useMemo(() => {
    const stats = filteredOrders.reduce((acc, order) => {
      const amount = parseFloat(order.total.toString());
      if (!isNaN(amount)) {
        if (order.currency) {
          acc[order.currency] = (acc[order.currency] || 0) + amount;
        }
        acc.total = (acc.total || 0) + amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const currencies = Object.keys(stats).filter((key) => key !== "total");

    return {
      byCurrency: currencies.map((currency) => ({
        currency,
        total: stats[currency].toFixed(2),
        count: filteredOrders.filter((order) => order.currency === currency)
          .length,
      })),
      grandTotal: stats.total || 0,
    };
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">
                {filteredOrders.length}
              </p>
            </div>
            <div className="p-2 bg-blue-200 rounded-full">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        {revenueStats.byCurrency.map(({ currency, total, count }) => (
          <div
            key={currency}
            className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">
                  {currency} Revenue
                </p>
                <p className="text-2xl font-bold text-green-900">{total}</p>
                <p className="text-xs text-green-600">{count} orders</p>
              </div>
              <div className="p-2 bg-green-200 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
        ))}

        {revenueStats.byCurrency.length === 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">0.00</p>
                <p className="text-xs text-gray-600">No orders</p>
              </div>
              <div className="p-2 bg-gray-200 rounded-full">
                <DollarSign className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500 mt-1">
            {dateFilter === "All" ? "All time" : dateFilter} •{" "}
            {currencyFilter === "All" ? "All currencies" : currencyFilter}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-end space-x-2">
        {/* Date Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <Calendar className="h-4 w-4" />
              {dateFilter === "All" ? "Date Range" : dateFilter}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => setDateFilter("All")}
              className={dateFilter === "All" ? "bg-gray-100" : ""}
            >
              All Time
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDateFilter("Today")}
              className={dateFilter === "Today" ? "bg-gray-100" : ""}
            >
              Today
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDateFilter("This Week")}
              className={dateFilter === "This Week" ? "bg-gray-100" : ""}
            >
              This Week
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDateFilter("This Month")}
              className={dateFilter === "This Month" ? "bg-gray-100" : ""}
            >
              This Month
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDateFilter("This Year")}
              className={dateFilter === "This Year" ? "bg-gray-100" : ""}
            >
              This Year
            </DropdownMenuItem>

            {uniqueDates.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-t">
                  Specific Dates
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {uniqueDates.slice(0, 10).map((date) => (
                    <DropdownMenuItem
                      key={date.value}
                      onClick={() => setDateFilter(date.value)}
                      className={dateFilter === date.value ? "bg-gray-100" : ""}
                    >
                      {date.display}
                    </DropdownMenuItem>
                  ))}
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Currency Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              {currencyFilter === "All" ? "Currency" : currencyFilter}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onClick={() => setCurrencyFilter("All")}
              className={currencyFilter === "All" ? "bg-gray-100" : ""}
            >
              All
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setCurrencyFilter("MYR")}
              className={currencyFilter === "MYR" ? "bg-gray-100" : ""}
            >
              MYR
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setCurrencyFilter("SGD")}
              className={currencyFilter === "SGD" ? "bg-gray-100" : ""}
            >
              SGD
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 border-b border-gray-200">
              <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order No
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                Total
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, i) => (
                <TableRow
                  key={order.order_id || i}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150"
                >
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-900">
                    #{order.order_id}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-900">
                    {order.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600">
                    {order.phone}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600">
                    {order.package_type || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                    {order.total} {order.currency}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600">
                    {new Date(order.order_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  {currencyFilter === "All" && dateFilter === "All"
                    ? "No orders found"
                    : `No orders found for selected filters`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
