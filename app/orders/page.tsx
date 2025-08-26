// app/orders/page.tsx - Complete Orders Page with Product Selection
"use client";

import { useState, useEffect, Key, JSXElementConstructor, ReactElement, ReactNode, ReactPortal } from "react";
import { 
  useSupabaseOrders, 
  useSupabaseOrderSearch, 
  useCreateOrder,
  CreateOrderData,
  OrderItem 
} from "@/hooks/useSupabase";
import { useCustomers } from "@/hooks/useCustomers";
import { useActiveProducts, useActivePackages } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Download, 
  RefreshCw, 
  Plus,
  Minus,
  Package,
  ShoppingCart,
  Calculator,
  User,
  CheckCircle,
  AlertCircle,
  FileText,
  Trash2
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import SupabaseOrdersTable from "@/components/dashboard/SupabaseOrdersTable";
import { toast } from "sonner";
import CreateOrderDialog from "@/components/order/CreateOrderDialog";

export default function OrdersPage() {
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
  const [isExporting, setIsExporting] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

  const pageSize = 50;

  // Create Order Form State
  const [orderForm, setOrderForm] = useState<CreateOrderData>({
    customer_name: '',
    phone_number: '',
    fb_name: '',
    email: '',
    customer_type: 'new',
    total_amount: 0,
    subtotal: 0,
    postage: 0,
    website_charges: 0,
    payment_method: 'cash',
    payment_status: 'pending',
    currency: 'MYR',
    source: 'manual',
    agent_name: 'Admin',
    notes: '',
    address: '',
    city: '',
    postcode: '',
    state: '',
    country: 'Malaysia',
    items: []
  });

  // Product Selection States
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedProductType, setSelectedProductType] = useState<'product' | 'package'>('product');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState(1);

  // Hooks
  const { createOrder, isCreating, error: createError, setError } = useCreateOrder();
  const { products, isLoading: productsLoading } = useActiveProducts();
  const { packages, isLoading: packagesLoading } = useActivePackages();

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
  const { results: searchResults, isLoading: isSearching, search } = useSupabaseOrderSearch({
    q: searchQuery.length >= 3 ? searchQuery : undefined,
    limit: 50,
  });

  // Customer search for order creation
  const { customers: searchedCustomers, isLoading: isCustomerSearchLoading } = useCustomers({
    search: customerSearchQuery.length >= 2 ? customerSearchQuery : undefined,
    limit: 10
  });

  // Use search results if searching, otherwise use filtered orders
  const displayOrders = searchQuery.length >= 3 ? searchResults : orders;
  const displayLoading = searchQuery.length >= 3 ? isSearching : isLoading;

  // Get available items based on selected type
  const availableItems = selectedProductType === 'product' ? products : packages;

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

  // Handle customer selection
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setOrderForm(prev => ({
      ...prev,
      customer_name: customer.customer_name,
      phone_number: customer.phone_number,
      fb_name: customer.fb_name || '',
      email: customer.email || '',
      customer_type: customer.customer_type || 'repeat'
    }));
    setCustomerSearchQuery('');
  };

  // Add item to order
  const handleAddItem = () => {
    if (!selectedItemId) {
      toast.error('Please select a product or package');
      return;
    }

    const item = availableItems.find((p: { id: { toString: () => string; }; }) => p.id?.toString() === selectedItemId);
    if (!item) return;

    const unitPrice = item.base_price || 0;
    const totalPrice = unitPrice * itemQuantity;

    const orderItem: OrderItem = {
      id: `${selectedProductType}-${item.id}-${Date.now()}`,
      type: selectedProductType,
      item_id: item.id!,
      item_name: selectedProductType === 'product' ? (item as any).product_name : (item as any).package_name,
      item_code: selectedProductType === 'product' ? (item as any).product_code : (item as any).package_code,
      quantity: itemQuantity,
      unit_price: unitPrice,
      total_price: totalPrice,
    };

    setOrderForm(prev => ({
      ...prev,
      items: [...(prev.items || []), orderItem]
    }));

    // Reset selection
    setSelectedItemId('');
    setItemQuantity(1);
  };

  // Remove item from order
  const handleRemoveItem = (itemId: string) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== itemId) || []
    }));
  };

  // Update item quantity
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setOrderForm(prev => ({
      ...prev,
      items: prev.items?.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity, total_price: item.unit_price * newQuantity }
          : item
      ) || []
    }));
  };

  // Calculate totals automatically
  const calculateTotals = () => {
    const items = orderForm.items || [];
    const itemsSubtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const postage = orderForm.postage || 0;
    const websiteCharges = orderForm.website_charges || 0;
    const total = itemsSubtotal + postage + websiteCharges;
    
    setOrderForm(prev => ({
      ...prev,
      subtotal: itemsSubtotal,
      total_amount: total
    }));
  };

  // Recalculate totals when items, postage, or website charges change
  useEffect(() => {
    calculateTotals();
  }, [orderForm.items, orderForm.postage, orderForm.website_charges]);

  // Handle form submission
  const handleCreateOrder = async () => {
    try {
      // Validation
      if (!orderForm.customer_name.trim()) {
        toast.error('Customer name is required');
        return;
      }
      if (!orderForm.phone_number.trim()) {
        toast.error('Phone number is required');
        return;
      }
      if (!orderForm.items?.length) {
        toast.error('Please add at least one product or package');
        return;
      }
      if (orderForm.total_amount <= 0) {
        toast.error('Order total must be greater than 0');
        return;
      }

      await createOrder(orderForm);
      toast.success('Order created successfully!');
      setIsCreateOrderOpen(false);
      
      // Reset form
      setOrderForm({
        customer_name: '',
        phone_number: '',
        fb_name: '',
        email: '',
        customer_type: 'new',
        total_amount: 0,
        subtotal: 0,
        postage: 0,
        website_charges: 0,
        payment_method: 'cash',
        payment_status: 'pending',
        currency: 'MYR',
        source: 'manual',
        agent_name: 'Admin',
        notes: '',
        address: '',
        city: '',
        postcode: '',
        state: '',
        country: 'Malaysia',
        items: []
      });
      setSelectedCustomer(null);
      setCustomerSearchQuery('');
      setSelectedItemId('');
      setItemQuantity(1);
      
      // Refresh orders list
      refresh();
    } catch (error) {
      console.error('Create order error:', error);
    }
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
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </Button>
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

      {/* Create Order Dialog with Product Selection */}
      <div className="w-full mx-auto">
        <CreateOrderDialog isOpen={isCreateOrderOpen} onClose={() => setIsCreateOrderOpen(false)} onSuccess={handleCreateOrder} />
      </div>
    </div>
  );
}