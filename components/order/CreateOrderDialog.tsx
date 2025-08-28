// components/orders/CreateOrderDialog.tsx - Redesigned with Enhanced UX and Fixed Error Handling
"use client";

import { useState, useEffect, Key, JSXElementConstructor, ReactElement, ReactNode, ReactPortal } from "react";
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
  Plus,
  Minus,
  Search,
  Package,
  ShoppingCart,
  User,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Trash2,
  ArrowRight,
  ArrowLeft,
  MapPin,
  CreditCard,
  Calculator,
  Check,
  ChevronDown,
  Zap
} from "lucide-react";
import { toast } from "sonner";

// Types
interface CreateOrderData {
  customer_name: string;
  phone_number: string;
  fb_name: string;
  email: string;
  customer_type: 'new' | 'repeat';
  total_amount: number;
  subtotal: number;
  postage: number;
  website_charges: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  currency: string;
  source: string;
  agent_name: string;
  notes: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  postcode: string;
  state: string;
  country: string;
  items: OrderItem[];
}

interface OrderItem {
  id?: string;
  type: 'product' | 'package';
  item_id: number | string;
  item_name: string;
  item_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'customer' | 'products' | 'details' | 'review';

// Create Order Hook (inline implementation to fix error handling)
function useCreateOrder() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (orderData: CreateOrderData) => {
    setIsCreating(true);
    setError(null);
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const response = await fetch(`${API_BASE_URL}/api/supabase/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const responseData = await response.json().catch(() => ({ success: false, details: 'Invalid response format' }));

      if (!response.ok) {
        throw new Error(responseData.details || responseData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!responseData.success) {
        throw new Error(responseData.details || responseData.message || 'Order creation failed');
      }

      return responseData;
    } catch (err) {
      let errorMessage = 'Failed to create order';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        errorMessage = (err as any).details || (err as any).message || JSON.stringify(err);
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createOrder,
    isCreating,
    error,
    setError,
  };
}

export default function CreateOrderDialog({ isOpen, onClose, onSuccess }: Props) {
  // Core hooks
  const { createOrder, isCreating, error: createError, setError } = useCreateOrder();
  const { products, isLoading: productsLoading } = useActiveProducts();
  const { packages, isLoading: packagesLoading } = useActivePackages();

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('customer');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  // Form state
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
    address_line_1: '',
    address_line_2: '',
    city: '',
    postcode: '',
    state: '',
    country: 'Malaysia',
    items: []
  });

  // Customer states
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  // Product states
  const [selectedProductType, setSelectedProductType] = useState<'product' | 'package'>('product');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState(1);

  // Customer search
  const { customers: searchedCustomers } = useCustomers({
    search: customerSearchQuery.length >= 2 ? customerSearchQuery : undefined,
    limit: 8
  });

  // Available items
  const availableItems = selectedProductType === 'product' ? products : packages;

  // Step configuration
  const steps: { id: Step; title: string; icon: any; description: string }[] = [
    { id: 'customer', title: 'Customer', icon: User, description: 'Select or create customer' },
    { id: 'products', title: 'Products', icon: Package, description: 'Add products to order' },
    { id: 'details', title: 'Details', icon: MapPin, description: 'Shipping & payment' },
    { id: 'review', title: 'Review', icon: CheckCircle, description: 'Confirm order' }
  ];

  // Validation functions
  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 'customer':
        return !!(orderForm.customer_name && orderForm.phone_number);
      case 'products':
        return (orderForm.items?.length || 0) > 0;
      case 'details':
        return !!(orderForm.address_line_1 && orderForm.city);
      case 'review':
        return orderForm.total_amount > 0;
      default:
        return false;
    }
  };

  // Step navigation
  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      const stepOrder: Step[] = ['customer', 'products', 'details', 'review'];
      const currentIndex = stepOrder.indexOf(currentStep);
      if (currentIndex < stepOrder.length - 1) {
        setCurrentStep(stepOrder[currentIndex + 1]);
      }
    } else {
      toast.error('Please complete all required fields');
    }
  };

  const prevStep = () => {
    const stepOrder: Step[] = ['customer', 'products', 'details', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  // Customer handlers
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
    setShowCustomerResults(false);
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setOrderForm(prev => ({
      ...prev,
      customer_name: '',
      phone_number: '',
      fb_name: '',
      email: '',
      customer_type: 'new'
    }));
  };

  // Product handlers
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

    setSelectedItemId('');
    setItemQuantity(1);
    toast.success('Item added to order');
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== itemId) || []
    }));
    toast.success('Item removed from order');
  };

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

  // Calculate totals
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

  useEffect(() => {
    calculateTotals();
  }, [orderForm.items, orderForm.postage, orderForm.website_charges]);

  // Handle submission
  const handleCreateOrder = async () => {
    try {
      if (!validateStep('customer') || !validateStep('products') || !validateStep('details')) {
        toast.error('Please complete all required fields');
        return;
      }

      await createOrder(orderForm);
      toast.success('Order created successfully!');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Create order error:', error);
    }
  };

  // Reset form
  const handleClose = () => {
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
      address_line_1: '',
      address_line_2: '',
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
    setCurrentStep('customer');
    setCompletedSteps(new Set());
    setError(null);
    onClose();
  };

  // Customer step content
  const renderCustomerStep = () => (
    <div className="space-y-6">
      <div className="text-center pb-4">
        <User className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold">Customer Information</h3>
        <p className="text-gray-600">Search for existing customer or create new</p>
      </div>

      {/* Customer Search */}
      <div className="relative">
        <Label>Find Existing Customer</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name or phone..."
            value={customerSearchQuery}
            onChange={(e) => {
              setCustomerSearchQuery(e.target.value);
              setShowCustomerResults(e.target.value.length >= 2);
            }}
            className="pl-10"
          />
        </div>
        
        {/* Search Results Dropdown */}
        {showCustomerResults && searchedCustomers.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto mt-1">
            {searchedCustomers.map((customer: any) => (
              <button
                key={customer.id}
                onClick={() => handleCustomerSelect(customer)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {String(customer.customer_name || '').split(' ').map((n: string) => n[0]).join('') || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{customer.customer_name}</p>
                  <p className="text-sm text-gray-500">{customer.phone_number}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {customer.customer_type || 'customer'}
                </Badge>
              </button>
            ))}
          </div>
        )}

        {/* Selected Customer */}
        {selectedCustomer && (
          <div className="mt-3 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">{selectedCustomer.customer_name}</p>
              <p className="text-sm text-blue-600">{selectedCustomer.phone_number}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearCustomerSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Customer Form */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <span className="text-sm font-medium">Customer Details</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Full Name *</Label>
            <Input
              value={orderForm.customer_name}
              onChange={(e) => setOrderForm(prev => ({ ...prev, customer_name: e.target.value }))}
              placeholder="Enter customer name"
              className={!orderForm.customer_name ? 'border-red-200' : ''}
            />
          </div>

          <div>
            <Label>Phone Number *</Label>
            <Input
              value={orderForm.phone_number}
              onChange={(e) => {
                let value = e.target.value;
                // Auto-add + if not present and user starts typing numbers
                if (value && !value.startsWith('+') && /^\d/.test(value)) {
                  value = '+' + value;
                }
                setOrderForm(prev => ({ ...prev, phone_number: value }));
              }}
              placeholder="+60123456789"
              className={!orderForm.phone_number ? 'border-red-200' : ''}
            />
            <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +60 for Malaysia)</p>
          </div>

          <div>
            <Label>Facebook Name</Label>
            <Input
              value={orderForm.fb_name}
              onChange={(e) => setOrderForm(prev => ({ ...prev, fb_name: e.target.value }))}
              placeholder="FB username"
            />
          </div>

          <div>
            <Label>Customer Type</Label>
            <Select value={orderForm.customer_type} onValueChange={(value: any) => setOrderForm(prev => ({ ...prev, customer_type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    New Customer
                  </div>
                </SelectItem>
                <SelectItem value="repeat">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Repeat Customer
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Email (Optional)</Label>
          <Input
            type="email"
            value={orderForm.email}
            onChange={(e) => setOrderForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="customer@example.com"
          />
        </div>
      </div>
    </div>
  );

  // Products step content
  const renderProductsStep = () => (
    <div className="space-y-6">
      <div className="text-center pb-4">
        <Package className="h-12 w-12 text-purple-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold">Add Products</h3>
        <p className="text-gray-600">Select products and packages for this order</p>
      </div>

      {/* Product Selection */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label>Product Type</Label>
            <Select value={selectedProductType} onValueChange={(value: any) => setSelectedProductType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Individual Products</SelectItem>
                <SelectItem value="package">Product Packages</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label>Select Item</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder={`Choose ${selectedProductType}...`} />
              </SelectTrigger>
              <SelectContent>
                {productsLoading || packagesLoading ? (
                  <SelectItem value="" disabled>Loading...</SelectItem>
                ) : (
                  availableItems.map((item: any) => (
                    <SelectItem key={item.id} value={item.id!.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">
                          {selectedProductType === 'product' ? item.product_name : item.package_name}
                        </span>
                        <span className="ml-2 text-sm font-medium text-green-600">
                          MYR {(item.base_price || 0).toFixed(2)}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-none w-32">
            <Label>Quantity</Label>
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                disabled={itemQuantity <= 1}
                className="h-10 w-10 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center mx-1 w-16"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItemQuantity(itemQuantity + 1)}
                className="h-10 w-10 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAddItem}
            disabled={!selectedItemId}
            className="mt-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {selectedItemId && (
          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <span className="text-sm">Total Price:</span>
            <span className="font-bold text-lg text-green-600">
              MYR {((availableItems.find((p: { id: { toString: () => string; }; }) => p.id?.toString() === selectedItemId)?.base_price || 0) * itemQuantity).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Order Items ({orderForm.items?.length || 0})</h4>
          {orderForm.items?.length ? (
            <Badge className="bg-green-100 text-green-800">
              Subtotal: MYR {(orderForm.subtotal || 0).toFixed(2)}
            </Badge>
          ) : null}
        </div>

        {orderForm.items?.length ? (
          <div className="space-y-2">
            {orderForm.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-white border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{item.item_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                    {item.item_code && (
                      <span className="text-xs text-gray-500">{item.item_code}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpdateQuantity(item.id!, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-medium text-sm w-8 text-center">{item.quantity}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpdateQuantity(item.id!, item.quantity + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="text-right">
                  <p className="font-bold">MYR {item.total_price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">@ {item.unit_price.toFixed(2)}</p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(item.id!)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No items added yet</p>
            <p className="text-sm">Select products above to add them to the order</p>
          </div>
        )}
      </div>
    </div>
  );

  // Details step content
  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center pb-4">
        <MapPin className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold">Shipping & Payment</h3>
        <p className="text-gray-600">Add delivery details and payment information</p>
      </div>

      <div className="space-y-6">
        {/* Shipping Address */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="font-medium">Shipping Address</span>
          </div>

          <div className="space-y-4">
            <Label>Street Address *</Label>
            <div className="space-y-3">
              <div>
                <Input
                  value={orderForm.address_line_1}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, address_line_1: e.target.value }))}
                  placeholder="Address Line 1 (Street, Building Number)"
                  className={!orderForm.address_line_1 ? 'border-red-200' : ''}
                />
              </div>
              <div>
                <Input
                  value={orderForm.address_line_2}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, address_line_2: e.target.value }))}
                  placeholder="Address Line 2 (Apartment, Suite, Floor - Optional)"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>City *</Label>
              <Input
                value={orderForm.city}
                onChange={(e) => setOrderForm(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Kuala Lumpur"
                className={!orderForm.city ? 'border-red-200' : ''}
              />
            </div>
            <div>
              <Label>Postcode</Label>
              <Input
                value={orderForm.postcode}
                onChange={(e) => setOrderForm(prev => ({ ...prev, postcode: e.target.value }))}
                placeholder="50100"
              />
            </div>
            <div>
              <Label>State/Province</Label>
              <Input
                value={orderForm.state}
                onChange={(e) => setOrderForm(prev => ({ ...prev, state: e.target.value }))}
                placeholder="Selangor"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Select value={orderForm.country} onValueChange={(value) => setOrderForm(prev => ({ ...prev, country: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Malaysia">🇲🇾 Malaysia</SelectItem>
                  <SelectItem value="Singapore">🇸🇬 Singapore</SelectItem>
                  <SelectItem value="Thailand">🇹🇭 Thailand</SelectItem>
                  <SelectItem value="Indonesia">🇮🇩 Indonesia</SelectItem>
                  <SelectItem value="Philippines">🇵🇭 Philippines</SelectItem>
                  <SelectItem value="Vietnam">🇻🇳 Vietnam</SelectItem>
                  <SelectItem value="Other">🌍 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Payment Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Payment Method</Label>
              <Select value={orderForm.payment_method} onValueChange={(value) => setOrderForm(prev => ({ ...prev, payment_method: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Cash</SelectItem>
                  <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">💳 Credit Card</SelectItem>
                  <SelectItem value="online_banking">🌐 Online Banking</SelectItem>
                  <SelectItem value="e_wallet">📱 E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Status</Label>
              <Select value={orderForm.payment_status} onValueChange={(value: any) => setOrderForm(prev => ({ ...prev, payment_status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="paid">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Paid
                    </div>
                  </SelectItem>
                  <SelectItem value="failed">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Failed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Charges */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Calculator className="h-4 w-4 text-orange-600" />
            <span className="font-medium">Additional Charges</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Shipping Fee (MYR)</Label>
              <Input
                type="number"
                step="0.01"
                value={orderForm.postage}
                onChange={(e) => setOrderForm(prev => ({ ...prev, postage: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Platform Fee (MYR)</Label>
                              <Input
                type="number"
                step="0.01"
                value={orderForm.website_charges}
                onChange={(e) => setOrderForm(prev => ({ ...prev, website_charges: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Order Notes */}
        <div>
          <Label>Order Notes</Label>
          <Textarea
            value={orderForm.notes}
            onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add special instructions, delivery notes, or comments..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  // Review step content
  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center pb-4">
        <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold">Review Order</h3>
        <p className="text-gray-600">Confirm all details before creating the order</p>
      </div>

      <div className="space-y-6">
        {/* Customer Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Customer</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <p className="font-medium">{orderForm.customer_name}</p>
            </div>
            <div>
              <span className="text-gray-600">Phone:</span>
              <p className="font-medium">{orderForm.phone_number}</p>
            </div>
            {orderForm.fb_name && (
              <div>
                <span className="text-gray-600">Facebook:</span>
                <p className="font-medium">{orderForm.fb_name}</p>
              </div>
            )}
            <div>
              <span className="text-gray-600">Type:</span>
              <Badge variant="outline" className="ml-2">
                {orderForm.customer_type}
              </Badge>
            </div>
          </div>
        </div>

        {/* Items Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Items ({orderForm.items?.length || 0})</span>
            </div>
            <Badge className="bg-green-100 text-green-800">
              Subtotal: MYR {(orderForm.subtotal || 0).toFixed(2)}
            </Badge>
          </div>
          <div className="space-y-2">
            {orderForm.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.item_name}</p>
                  <p className="text-xs text-gray-500">
                    {item.item_code} • Qty: {item.quantity} • @ MYR {item.unit_price.toFixed(2)}
                  </p>
                </div>
                <span className="font-bold">MYR {item.total_price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="font-medium">Shipping</span>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium">{orderForm.address_line_1}</p>
              {orderForm.address_line_2 && (
                <p className="text-gray-600">{orderForm.address_line_2}</p>
              )}
              <p className="text-gray-600">
                {[orderForm.city, orderForm.postcode, orderForm.state].filter(Boolean).join(', ')}
              </p>
              <p className="text-gray-600">{orderForm.country}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Payment</span>
            </div>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-600">Method:</span> <span className="font-medium">{orderForm.payment_method}</span></p>
              <p><span className="text-gray-600">Status:</span> 
                <Badge variant="outline" className="ml-2">
                  {orderForm.payment_status}
                </Badge>
              </p>
            </div>
          </div>
        </div>

        {/* Order Total */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Items Subtotal:</span>
              <span>MYR {(orderForm.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping Fee:</span>
              <span>MYR {(orderForm.postage || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Platform Fee:</span>
              <span>MYR {(orderForm.website_charges || 0).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total Amount:</span>
              <span className="text-blue-600">MYR {orderForm.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {orderForm.notes && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">Order Notes</span>
            </div>
            <p className="text-sm text-gray-700">{orderForm.notes}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <span>Create New Order</span>
              <p className="text-sm text-gray-600 font-normal">
                Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex-shrink-0 px-1 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = completedSteps.has(step.id);
              const isAccessible = index === 0 || completedSteps.has(steps[index - 1].id);
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => isAccessible ? goToStep(step.id) : null}
                    disabled={!isAccessible}
                    className={`
                      flex items-center gap-3 p-2 rounded-lg transition-all
                      ${isActive ? 'bg-blue-50 text-blue-700' : ''}
                      ${isCompleted ? 'text-green-600' : ''}
                      ${!isAccessible ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center transition-all
                      ${isActive ? 'bg-blue-600 text-white' : ''}
                      ${isCompleted && !isActive ? 'bg-green-600 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-600' : ''}
                    `}>
                      {isCompleted && !isActive ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <step.icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs opacity-75">{step.description}</p>
                    </div>
                  </button>
                  {index < steps.length - 1 && (
                    <div className="h-px bg-gray-200 flex-1 mx-2"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-1">
          {currentStep === 'customer' && renderCustomerStep()}
          {currentStep === 'products' && renderProductsStep()}
          {currentStep === 'details' && renderDetailsStep()}
          {currentStep === 'review' && renderReviewStep()}
        </div>

        {/* Error Display */}
        {createError && (
          <div className="flex-shrink-0 mx-1 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 font-medium text-sm">Failed to create order</p>
                <p className="text-red-700 text-sm mt-1">
                  {typeof createError === 'string' ? createError : 'An unexpected error occurred. Please try again.'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="mt-2 h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-100"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentStep !== 'customer' && (
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            
            {currentStep === 'review' ? (
              <Button
                onClick={handleCreateOrder}
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Create Order
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}