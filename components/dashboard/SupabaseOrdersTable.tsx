/* eslint-disable @typescript-eslint/no-explicit-any */
// components/dashboard/SupabaseOrdersTable.tsx - Updated for normalized schema
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  Calendar,
  DollarSign,
  RefreshCw,
  Eye,
  Edit,
  Phone,
  Package,
  Truck,
  User,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";

// ✅ FIXED: Updated Order interface to match normalized Supabase schema
interface SupabaseOrder {
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
  // ✅ FIXED: Joined customer data from normalized schema
  customers?: {
    id?: number;
    customer_name: string;
    phone_number: string;
    fb_name?: string;
    email?: string;
    customer_type?: "new" | "repeat";
  };
  // ✅ FIXED: Joined address data from normalized schema
  addresses?: {
    id?: number;
    address_line_1: string;
    address_line_2?: string;
    city?: string;
    postcode?: string;
    state?: string;
    country?: string;
  };
}

interface Props {
  orders: SupabaseOrder[];
  isLoading?: boolean;
  showPagination?: boolean;
}

export default function SupabaseOrdersTable({
  orders = [],
  isLoading = false,
}: Props) {
  const [sortField, setSortField] = useState<
    keyof SupabaseOrder | "customer_name" | "phone_number"
  >("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // ✅ FIXED: Updated sorting function for normalized schema
  const sortedOrders = useMemo(() => {
    if (!orders.length) return [];

    return [...orders].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === "customer_name") {
        aValue = a.customers?.customer_name;
        bValue = b.customers?.customer_name;
      } else if (sortField === "phone_number") {
        aValue = a.customers?.phone_number;
        bValue = b.customers?.phone_number;
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      // Handle customer fields that are now nested
      if (sortField === "customer_name") {
        aValue = a.customers?.customer_name;
        bValue = b.customers?.customer_name;
      } else if (sortField === "phone_number") {
        aValue = a.customers?.phone_number;
        bValue = b.customers?.phone_number;
      }

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      // For dates
      if (sortField === "order_date" || sortField === "created_at") {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }

      return 0;
    });
  }, [orders, sortField, sortDirection]);

  const handleSort = (
    field: keyof SupabaseOrder | "customer_name" | "phone_number"
  ) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field as keyof SupabaseOrder);
      setSortDirection("desc");
    }
  };

  const toggleRowExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  // ✅ FIXED: Updated status badges for normalized schema
  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Delivered
          </Badge>
        );
      case "shipped":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Shipped
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Processing
          </Badge>
        );
      case "confirmed":
        return (
          <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancelled
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  // ✅ FIXED: Updated payment status badges
  const getPaymentStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Failed
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const getCustomerTypeBadge = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "new":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            New
          </Badge>
        );
      case "repeat":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Repeat
          </Badge>
        );
      default:
        return <Badge variant="outline">{type || "Unknown"}</Badge>;
    }
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount === undefined || amount === null) return "N/A";
    return `${currency || "MYR"} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return "Invalid Date";
    }
  };

  const SortableHeader = ({
    field,
    children,
    className = "",
  }: {
    field: keyof SupabaseOrder | "customer_name" | "phone_number";
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={`cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            sortField === field
              ? sortDirection === "asc"
                ? "rotate-180"
                : ""
              : "opacity-50"
          }`}
        />
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Loading orders...</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="p-8 text-center">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No orders found
        </h3>
        <p className="text-gray-500">
          Try adjusting your filters or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 border-b border-gray-200">
              <TableHead className="w-12"></TableHead>
              <SortableHeader field="order_number" className="w-24">
                Order #
              </SortableHeader>
              <SortableHeader field="customer_name">Customer</SortableHeader>
              <SortableHeader field="phone_number">Contact</SortableHeader>
              <SortableHeader field="total_amount" className="text-right">
                Amount
              </SortableHeader>
              <SortableHeader field="status">Status</SortableHeader>
              <SortableHeader field="payment_status">Payment</SortableHeader>
              <SortableHeader field="order_date">Order Date</SortableHeader>
              <TableHead>Tracking</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.map((order, index) => (
              <>
                <TableRow
                  key={order.id || index}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150"
                >
                  <TableCell className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => order.id && toggleRowExpansion(order.id)}
                      className="p-1"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>

                  {/* ✅ FIXED: Show order number instead of ID */}
                  <TableCell className="px-4 py-3 text-sm font-mono text-gray-600">
                    {order.order_number || `#${order.id}`}
                  </TableCell>

                  {/* ✅ FIXED: Access customer data through customers object */}
                  <TableCell className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {order.customers?.customer_name || "N/A"}
                      </div>
                      {order.customers?.fb_name && (
                        <div className="text-xs text-gray-500">
                          FB: {order.customers.fb_name}
                        </div>
                      )}
                      {order.customers?.customer_type && (
                        <div className="mt-1">
                          {getCustomerTypeBadge(order.customers.customer_type)}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* ✅ FIXED: Access phone through customers object */}
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Phone className="h-3 w-3" />
                      {order.customers?.phone_number || "N/A"}
                    </div>
                    {order.customers?.email && (
                      <div className="text-xs text-gray-500 mt-1">
                        {order.customers.email}
                      </div>
                    )}
                  </TableCell>

                  {/* ✅ FIXED: Use total_amount instead of total_paid */}
                  <TableCell className="px-4 py-3 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.total_amount, order.currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.payment_method}
                    </div>
                    {order.subtotal &&
                      order.subtotal !== order.total_amount && (
                        <div className="text-xs text-gray-400">
                          Subtotal:{" "}
                          {formatCurrency(order.subtotal, order.currency)}
                        </div>
                      )}
                  </TableCell>

                  <TableCell className="px-4 py-3">
                    {getStatusBadge(order.status)}
                    {order.source && (
                      <div className="text-xs text-gray-500 mt-1">
                        via {order.source}
                      </div>
                    )}
                  </TableCell>

                  {/* ✅ NEW: Payment Status Column */}
                  <TableCell className="px-4 py-3">
                    {getPaymentStatusBadge(order.payment_status)}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(order.order_date)}
                  </TableCell>

                  <TableCell className="px-4 py-3">
                    {order.tracking_number ? (
                      <div className="flex items-center gap-1">
                        <Truck className="h-3 w-3 text-gray-400" />
                        <div>
                          <div className="text-xs font-mono text-gray-900">
                            {order.tracking_number}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.courier_company}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No tracking</span>
                    )}
                  </TableCell>
                </TableRow>

                {/* ✅ FIXED: Expanded Row Details for normalized schema */}
                {order.id && expandedRows.has(order.id) && (
                  <TableRow key={`${order.id}-expanded`}>
                    <TableCell colSpan={9} className="bg-gray-50 p-0">
                      <div className="p-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* ✅ FIXED: Order Details using normalized schema */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Order Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              {order.subtotal && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Subtotal:
                                  </span>
                                  <span>
                                    {formatCurrency(
                                      order.subtotal,
                                      order.currency
                                    )}
                                  </span>
                                </div>
                              )}
                              {order.postage && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Postage:
                                  </span>
                                  <span>
                                    {formatCurrency(
                                      order.postage,
                                      order.currency
                                    )}
                                  </span>
                                </div>
                              )}
                              {order.website_charges && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Website Charges:
                                  </span>
                                  <span>
                                    {formatCurrency(
                                      order.website_charges,
                                      order.currency
                                    )}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between font-medium border-t pt-2">
                                <span className="text-gray-900">Total:</span>
                                <span>
                                  {formatCurrency(
                                    order.total_amount,
                                    order.currency
                                  )}
                                </span>
                              </div>
                              {order.agent_name && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Agent:</span>
                                  <span>{order.agent_name}</span>
                                </div>
                              )}
                              {order.cash_sale_receipt && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Receipt:
                                  </span>
                                  <span className="font-mono text-xs">
                                    {order.cash_sale_receipt}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ✅ NEW: Customer & Address Details */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Customer & Address
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-500 block">
                                  Customer:
                                </span>
                                <span className="font-medium">
                                  {order.customers?.customer_name}
                                </span>
                                {order.customers?.customer_type && (
                                  <span className="ml-2">
                                    {getCustomerTypeBadge(
                                      order.customers.customer_type
                                    )}
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-gray-500 block">
                                  Contact:
                                </span>
                                <span>{order.customers?.phone_number}</span>
                                {order.customers?.email && (
                                  <div className="text-gray-600">
                                    {order.customers.email}
                                  </div>
                                )}
                              </div>
                              {order.addresses && (
                                <div>
                                  <span className="text-gray-500 block">
                                    Address:
                                  </span>
                                  <div className="text-gray-900">
                                    {order.addresses.address_line_1}
                                    {order.addresses.address_line_2 && (
                                      <div>
                                        {order.addresses.address_line_2}
                                      </div>
                                    )}
                                    <div>
                                      {[
                                        order.addresses.city,
                                        order.addresses.postcode,
                                        order.addresses.state,
                                      ]
                                        .filter(Boolean)
                                        .join(", ")}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ✅ FIXED: Additional Information for normalized schema */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Additional Info
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Order #:</span>
                                <span className="font-mono">
                                  {order.order_number || order.id}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Customer ID:
                                </span>
                                <span className="font-mono">
                                  {order.customer_id}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Created:</span>
                                <span>{formatDate(order.created_at)}</span>
                              </div>
                              {order.updated_at &&
                                order.updated_at !== order.created_at && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Updated:
                                    </span>
                                    <span>{formatDate(order.updated_at)}</span>
                                  </div>
                                )}
                              {order.shipment_description && (
                                <div>
                                  <span className="text-gray-500 block">
                                    Shipment:
                                  </span>
                                  <span className="text-xs">
                                    {order.shipment_description}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ✅ FIXED: Notes/Remarks Section */}
                        {(order.notes || order.remark) && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-2">
                              Notes
                            </h4>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                              {order.notes || order.remark}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Order
                          </Button>
                          {order.tracking_number && (
                            <Button variant="outline" size="sm">
                              <Truck className="h-4 w-4 mr-2" />
                              Track Package
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-2" />
                            Contact Customer
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ✅ FIXED: Summary Footer using normalized schema */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Orders:</span>
            <span className="ml-2 font-medium">{orders.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Revenue:</span>
            <span className="ml-2 font-medium">
              {formatCurrency(
                orders.reduce(
                  (sum, order) => sum + (order.total_amount || 0),
                  0
                ),
                orders[0]?.currency
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Avg Order Value:</span>
            <span className="ml-2 font-medium">
              {formatCurrency(
                orders.length > 0
                  ? orders.reduce(
                      (sum, order) => sum + (order.total_amount || 0),
                      0
                    ) / orders.length
                  : 0,
                orders[0]?.currency
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Delivered Orders:</span>
            <span className="ml-2 font-medium">
              {orders.filter((order) => order.status === "delivered").length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Paid Orders:</span>
            <span className="ml-2 font-medium">
              {orders.filter((order) => order.payment_status === "paid").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
