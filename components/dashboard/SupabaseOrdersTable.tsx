// components/dashboard/SupabaseOrdersTable.tsx
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
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  Filter, 
  Calendar, 
  DollarSign, 
  RefreshCw,
  Eye,
  Edit,
  Phone,
  Package,
  Truck
} from "lucide-react";
import { format } from "date-fns";

// Updated Order interface to match Supabase structure
interface SupabaseOrder {
  id?: number;
  order_date?: string;
  fb_name?: string;
  customer_name?: string;
  payment_method?: string;
  wash_qty?: number;
  femlift_30ml_qty?: number;
  femlift_10ml_qty?: number;
  wash_30ml_qty?: number;
  spray_qty?: number;
  remark?: string;
  package_price?: number;
  postage?: number;
  total_paid?: number;
  shipment_description?: string;
  phone_number?: string;
  tracking_number?: string;
  courier_company?: string;
  status?: string;
  new_or_repeat?: "new" | "repeat";
  cash_sale_receipt?: string;
  agent_name?: string;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

interface Props {
  orders: SupabaseOrder[];
  isLoading?: boolean;
  showPagination?: boolean;
}

export default function SupabaseOrdersTable({ orders = [], isLoading = false, showPagination = true }: Props) {
  const [sortField, setSortField] = useState<keyof SupabaseOrder>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Sorting function
  const sortedOrders = useMemo(() => {
    if (!orders.length) return [];

    return [...orders].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // For dates
      if (sortField === 'order_date' || sortField === 'created_at') {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      return 0;
    });
  }, [orders, sortField, sortDirection]);

  const handleSort = (field: keyof SupabaseOrder) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
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

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const getCustomerTypeBadge = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'new':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">New</Badge>;
      case 'repeat':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Repeat</Badge>;
      default:
        return <Badge variant="outline">{type || 'Unknown'}</Badge>;
    }
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount === undefined || amount === null) return 'N/A';
    return `${currency || 'MYR'} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid Date';
    }
  };

  const SortableHeader = ({ 
    field, 
    children, 
    className = "" 
  }: { 
    field: keyof SupabaseOrder; 
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
              ? sortDirection === 'asc' ? 'rotate-180' : '' 
              : 'opacity-50'
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
        <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
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
              <SortableHeader field="id" className="w-20">ID</SortableHeader>
              <SortableHeader field="customer_name">Customer</SortableHeader>
              <SortableHeader field="phone_number">Contact</SortableHeader>
              <SortableHeader field="total_paid" className="text-right">Amount</SortableHeader>
              <SortableHeader field="status">Status</SortableHeader>
              <SortableHeader field="order_date">Order Date</SortableHeader>
              <SortableHeader field="new_or_repeat">Type</SortableHeader>
              <TableHead>Tracking</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.map((order,index) => (
              <>
                <TableRow
                  key={index}
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
                  
                  <TableCell className="px-4 py-3 text-sm font-mono text-gray-600">
                    #{order.id}
                  </TableCell>
                  
                  <TableCell className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer_name || 'N/A'}
                      </div>
                      {order.fb_name && (
                        <div className="text-xs text-gray-500">
                          FB: {order.fb_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Phone className="h-3 w-3" />
                      {order.phone_number || 'N/A'}
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-4 py-3 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.total_paid, order.currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.payment_method}
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-4 py-3">
                    {getStatusBadge(order.status)}
                  </TableCell>
                  
                  <TableCell className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(order.order_date)}
                  </TableCell>
                  
                  <TableCell className="px-4 py-3">
                    {getCustomerTypeBadge(order.new_or_repeat)}
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

                {/* Expanded Row Details */}
                {order.id && expandedRows.has(order.id) && (
                  <TableRow key={index}>
                    <TableCell colSpan={9} className="bg-gray-50 p-0">
                      <div className="p-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Order Details */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Order Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Package Price:</span>
                                <span>{formatCurrency(order.package_price, order.currency)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Postage:</span>
                                <span>{formatCurrency(order.postage, order.currency)}</span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span className="text-gray-900">Total:</span>
                                <span>{formatCurrency(order.total_paid, order.currency)}</span>
                              </div>
                              {order.agent_name && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Agent:</span>
                                  <span>{order.agent_name}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Product Quantities */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Products</h4>
                            <div className="space-y-2 text-sm">
                              {order.wash_qty && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Wash 120ml:</span>
                                  <span>{order.wash_qty}</span>
                                </div>
                              )}
                              {order.femlift_30ml_qty && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Femlift 30ml:</span>
                                  <span>{order.femlift_30ml_qty}</span>
                                </div>
                              )}
                              {order.femlift_10ml_qty && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Femlift 10ml:</span>
                                  <span>{order.femlift_10ml_qty}</span>
                                </div>
                              )}
                              {order.wash_30ml_qty && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Wash 30ml:</span>
                                  <span>{order.wash_30ml_qty}</span>
                                </div>
                              )}
                              {order.spray_qty && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Spray:</span>
                                  <span>{order.spray_qty}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Additional Information */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Additional Info</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Created:</span>
                                <span>{formatDate(order.created_at)}</span>
                              </div>
                              {order.updated_at && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Updated:</span>
                                  <span>{formatDate(order.updated_at)}</span>
                                </div>
                              )}
                              {order.cash_sale_receipt && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Receipt:</span>
                                  <span className="font-mono text-xs">{order.cash_sale_receipt}</span>
                                </div>
                              )}
                              {order.shipment_description && (
                                <div>
                                  <span className="text-gray-500 block">Shipment:</span>
                                  <span className="text-xs">{order.shipment_description}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Remarks Section */}
                        {order.remark && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-2">Remarks</h4>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                              {order.remark}
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

      {/* Summary Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Orders:</span>
            <span className="ml-2 font-medium">{orders.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Revenue:</span>
            <span className="ml-2 font-medium">
              {formatCurrency(
                orders.reduce((sum, order) => sum + (order.total_paid || 0), 0),
                orders[0]?.currency
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Avg Order Value:</span>
            <span className="ml-2 font-medium">
              {formatCurrency(
                orders.length > 0 
                  ? orders.reduce((sum, order) => sum + (order.total_paid || 0), 0) / orders.length
                  : 0,
                orders[0]?.currency
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Completed Orders:</span>
            <span className="ml-2 font-medium">
              {orders.filter(order => order.status === 'completed').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}