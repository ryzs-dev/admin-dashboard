"use client";

import { useState, useEffect, useCallback } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { useActiveProducts, useActivePackages } from "@/hooks/useProducts";
import { useCreateOrder, CreateOrderData, OrderItem } from "@/hooks/useSupabase";
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
  Calculator,
  User,
  CheckCircle,
  AlertCircle,
  FileText,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce"; // Add debounce hook for search

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateOrderDialog({ isOpen, onClose, onSuccess }: Props) {
  // Hooks
  const { createOrder, isCreating, error: createError, setError } = useCreateOrder();
  const { products, isLoading: productsLoading } = useActiveProducts();
  const { packages, isLoading: packagesLoading } = useActivePackages();

  // Form States
  const [orderForm, setOrderForm] = useState<CreateOrderData>({
    customer_name: "",
    phone_number: "",
    fb_name: "",
    email: "",
    customer_type: "new",
    total_amount: 0,
    subtotal: 0,
    postage: 0,
    website_charges: 0,
    payment_method: "cash",
    payment_status: "pending",
    currency: "MYR",
    source: "manual",
    agent_name: "Admin",
    notes: "",
    address: "",
    city: "",
    postcode: "",
    state: "",
    country: "Malaysia",
    items: [],
  });

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(customerSearchQuery, 300); // Debounce search
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showShipping, setShowShipping] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Customer search
  const { customers: searchedCustomers, isLoading: customersLoading } = useCustomers({
    search: debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : undefined,
    limit: 10,
  });

  // Get available items
  const availableItems = [...products, ...packages].map((item: any) => ({
    ...item,
    type: products.includes(item) ? "product" : "package",
    name: products.includes(item) ? item.product_name : item.package_name,
    code: products.includes(item) ? item.product_code : item.package_code,
  }));

  // Handle customer selection
  const handleCustomerSelect = useCallback((customer: any) => {
    setSelectedCustomer(customer);
    setOrderForm((prev) => ({
      ...prev,
      customer_name: customer.customer_name,
      phone_number: customer.phone_number,
      fb_name: customer.fb_name || "",
      email: customer.email || "",
      customer_type: customer.customer_type || "repeat",
    }));
    setCustomerSearchQuery("");
    setErrors((prev) => ({ ...prev, customer_name: "", phone_number: "" }));
  }, []);

  // Add item to order
  const handleAddItem = useCallback(() => {
    if (!selectedItemId) {
      toast.error("Please select a product or package");
      return;
    }

    const item = availableItems.find((p) => p.id?.toString() === selectedItemId);
    if (!item) return;

    const unitPrice = item.base_price || 0;
    const totalPrice = unitPrice * itemQuantity;

    const orderItem: OrderItem = {
      id: `${item.type}-${item.id}-${Date.now()}`,
      type: item.type,
      item_id: item.id!,
      item_name: item.name,
      item_code: item.code,
      quantity: itemQuantity,
      unit_price: unitPrice,
      total_price: totalPrice,
    };

    setOrderForm((prev) => ({
      ...prev,
      items: [...(prev.items || []), orderItem],
    }));

    toast.success(`${item.name} added to order`);
    setSelectedItemId("");
    setItemQuantity(1);
  }, [selectedItemId, itemQuantity, availableItems]);

  // Remove item from order
  const handleRemoveItem = useCallback((itemId: string) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items?.filter((item) => item.id !== itemId) || [],
    }));
    toast.info("Item removed from order");
  }, []);

  // Update item quantity
  const handleUpdateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items?.map((item) =>
        item.id === itemId
          ? { ...item, quantity: newQuantity, total_price: item.unit_price * newQuantity }
          : item
      ) || [],
    }));
  }, []);

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const items = orderForm.items || [];
    const itemsSubtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const postage = orderForm.postage || 0;
    const websiteCharges = orderForm.website_charges || 0;
    const total = itemsSubtotal + postage + websiteCharges;

    setOrderForm((prev) => ({
      ...prev,
      subtotal: itemsSubtotal,
      total_amount: total,
    }));
  }, [orderForm.items, orderForm.postage, orderForm.website_charges]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!orderForm.customer_name.trim()) {
      newErrors.customer_name = "Customer name is required";
    }
    if (!orderForm.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    }
    if (!orderForm.address.trim() && showShipping) {
      newErrors.address = "Shipping address is required";
    }
    if (!orderForm.items?.length) {
      newErrors.items = "At least one item is required";
    }
    if (orderForm.total_amount <= 0) {
      newErrors.total_amount = "Order total must be greater than 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [orderForm, showShipping]);

  // Handle form submission
  const handleCreateOrder = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      await createOrder(orderForm);
      toast.success("Order created successfully!");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Create order error:", error);
      toast.error("Failed to create order");
    }
  };

  // Handle dialog close
  const handleClose = useCallback(() => {
    setOrderForm({
      customer_name: "",
      phone_number: "",
      fb_name: "",
      email: "",
      customer_type: "new",
      total_amount: 0,
      subtotal: 0,
      postage: 0,
      website_charges: 0,
      payment_method: "cash",
      payment_status: "pending",
      currency: "MYR",
      source: "manual",
      agent_name: "Admin",
      notes: "",
      address: "",
      city: "",
      postcode: "",
      state: "",
      country: "Malaysia",
      items: [],
    });
    setSelectedCustomer(null);
    setCustomerSearchQuery("");
    setSelectedItemId("");
    setItemQuantity(1);
    setErrors({});
    setShowShipping(false);
    setShowNotes(false);
    setError(null);
    onClose();
  }, [onClose, setError]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:p-6 p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Create New Order
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Add customer details and select products to create a new order.
          </DialogDescription>
        </DialogHeader>

        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Please fix the following errors:</p>
              <ul className="list-disc list-inside text-red-700 text-sm">
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="border rounded-lg p-4">
            <button
              className="flex items-center gap-2 text-sm font-medium text-gray-700 w-full"
              onClick={() => setShowShipping(!showShipping)}
              aria-expanded={showShipping}
            >
              <User className="h-4 w-4 text-blue-600" />
              Customer Information
            </button>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="customer-search">Search Existing Customer</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="customer-search"
                    placeholder="Search by name or phone..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="pl-10"
                    aria-describedby="customer-search-error"
                  />
                  {customersLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                {debouncedSearchQuery.length >= 2 && !customersLoading && (
                  <div className="mt-2 bg-white border rounded-lg shadow-sm max-h-40 overflow-y-auto">
                    {searchedCustomers.length > 0 ? (
                      searchedCustomers.map((customer: any) => (
                        <button
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                          aria-label={`Select customer ${customer.customer_name}`}
                        >
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {String(customer.customer_name || "")
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("") || "?"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{customer.customer_name}</p>
                            <p className="text-xs text-gray-500">{customer.phone_number}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
                    )}
                  </div>
                )}
                {selectedCustomer && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      Selected: {selectedCustomer.customer_name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setOrderForm((prev) => ({
                          ...prev,
                          customer_name: "",
                          phone_number: "",
                          fb_name: "",
                          email: "",
                          customer_type: "new",
                        }));
                      }}
                      aria-label="Clear selected customer"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="customer-name">Customer Name *</Label>
                  <Input
                    id="customer-name"
                    value={orderForm.customer_name}
                    onChange={(e) =>
                      setOrderForm((prev) => ({ ...prev, customer_name: e.target.value }))
                    }
                    placeholder="Enter customer name"
                    aria-invalid={!!errors.customer_name}
                    aria-describedby="customer-name-error"
                  />
                  {errors.customer_name && (
                    <p id="customer-name-error" className="text-red-600 text-xs mt-1">
                      {errors.customer_name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone-number">Phone Number *</Label>
                  <Input
                    id="phone-number"
                    value={orderForm.phone_number}
                    onChange={(e) =>
                      setOrderForm((prev) => ({ ...prev, phone_number: e.target.value }))
                    }
                    placeholder="+60123456789"
                    aria-invalid={!!errors.phone_number}
                    aria-describedby="phone-number-error"
                  />
                  {errors.phone_number && (
                    <p id="phone-number-error" className="text-red-600 text-xs mt-1">
                      {errors.phone_number}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="fb-name">Facebook Name</Label>
                    <Input
                      id="fb-name"
                      value={orderForm.fb_name}
                      onChange={(e) =>
                        setOrderForm((prev) => ({ ...prev, fb_name: e.target.value }))
                      }
                      placeholder="FB username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-type">Customer Type</Label>
                    <Select
                      value={orderForm.customer_type}
                      onValueChange={(value) =>
                        setOrderForm((prev) => ({ ...prev, customer_type: value as "new" | "repeat" }))
                      }
                    >
                      <SelectTrigger id="customer-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New Customer</SelectItem>
                        <SelectItem value="repeat">Repeat Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Details (Collapsible) */}
          <div className="border rounded-lg p-4">
            <button
              className="flex items-center gap-2 text-sm font-medium text-gray-700 w-full"
              onClick={() => setShowShipping(!showShipping)}
              aria-expanded={showShipping}
            >
              <Package className="h-4 w-4 text-green-600" />
              Shipping Details
              {showShipping ? (
                <ChevronUp className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-auto" />
              )}
            </button>
            {showShipping && (
              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="address">Shipping Address *</Label>
                  <Input
                    id="address"
                    value={orderForm.address}
                    onChange={(e) =>
                      setOrderForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="Street address, building, etc."
                    aria-invalid={!!errors.address}
                    aria-describedby="address-error"
                  />
                  {errors.address && (
                    <p id="address-error" className="text-red-600 text-xs mt-1">{errors.address}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={orderForm.city}
                      onChange={(e) => setOrderForm((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      value={orderForm.postage}
                      onChange={(e) =>
                        setOrderForm((prev) => ({ ...prev, postcode: e.target.value }))
                      }
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={orderForm.state}
                      onChange={(e) =>
                        setOrderForm((prev) => ({ ...prev, state: e.target.value }))
                      }
                      placeholder="State"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Selection */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Package className="h-4 w-4 text-purple-600" />
              Add Products/Packages
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="item-select">Select Product/Package</Label>
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger id="item-select">
                    <SelectValue placeholder="Choose an item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {productsLoading || packagesLoading ? (
                      <SelectItem value="" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      [
                        {
                          label: "Products",
                          items: products.map((item: any) => ({
                            ...item,
                            type: "product",
                            name: item.product_name,
                            code: item.product_code,
                          })),
                        },
                        {
                          label: "Packages",
                          items: packages.map((item: any) => ({
                            ...item,
                            type: "package",
                            name: item.package_name,
                            code: item.package_code,
                          })),
                        },
                      ].map((group) => (
                        <div key={group.label}>
                          <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                            {group.label}
                          </div>
                          {group.items.map((item: any) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              <div className="flex items-center justify-between w-full">
                                <span>{item.name}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  MYR {(item.base_price || 0).toFixed(2)}
                                  {item.stock && (
                                    <Badge variant="outline" className="ml-2">
                                      Stock: {item.stock}
                                    </Badge>
                                  )}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedItemId && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">
                    {availableItems.find((p) => p.id?.toString() === selectedItemId)?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Price: MYR{" "}
                    {(availableItems.find((p) => p.id?.toString() === selectedItemId)?.base_price ||
                      0).toFixed(2)}{" "}
                    | Stock:{" "}
                    {availableItems.find((p) => p.id?.toString() === selectedItemId)?.stock || "N/A"}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label>Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      disabled={itemQuantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-center"
                      aria-label="Item quantity"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Total Price</Label>
                  <Input
                    value={
                      selectedItemId
                        ? `MYR ${(
                            (availableItems.find((p) => p.id?.toString() === selectedItemId)
                              ?.base_price || 0) * itemQuantity
                          ).toFixed(2)}`
                        : "MYR 0.00"
                    }
                    readOnly
                    className="text-right font-medium"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedItemId}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Order
              </Button>
            </div>
          </div>

          {/* Order Items List */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium">Order Items ({orderForm.items?.length || 0})</Label>
              {orderForm.items?.length ? (
                <Badge variant="secondary">
                  Subtotal: MYR {(orderForm.subtotal || 0).toFixed(2)}
                </Badge>
              ) : null}
            </div>

            {orderForm.items?.length ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                      <TableHead className="w-20 text-right">Price</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderForm.items.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{item.item_name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.type}
                              </Badge>
                              {item.item_code && (
                                <span className="text-xs text-gray-500">{item.item_code}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.id!, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="h-6 w-6 p-0"
                              aria-label={`Decrease quantity for ${item.item_name}`}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.id!, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                              aria-label={`Increase quantity for ${item.item_name}`}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-medium">
                            MYR {item.total_price.toFixed(2)}
                          </span>
                          <div className="text-xs text-gray-500">
                            @ {item.unit_price.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id!)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            aria-label={`Remove ${item.item_name} from order`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="border border-dashed rounded-lg p-6 text-center text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No items added yet</p>
                <p className="text-xs">Add products or packages above</p>
              </div>
            )}
          </div>

          {/* Order Summary (Sticky on large screens) */}
          {orderForm.items?.length ? (
            <div className="lg:sticky lg:top-4 bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Calculator className="h-4 w-4 text-green-600" />
                Order Summary
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>MYR {(orderForm.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Postage:</span>
                  <span>MYR {(orderForm.postage || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Website Charges:</span>
                  <span>MYR {(orderForm.website_charges || 0).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-base font-semibold text-blue-600">
                  <span>Total:</span>
                  <span>MYR {orderForm.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Order Notes (Collapsible) */}
          <div className="border rounded-lg p-4">
            <button
              className="flex items-center gap-2 text-sm font-medium text-gray-700 w-full"
              onClick={() => setShowNotes(!showNotes)}
              aria-expanded={showNotes}
            >
              <FileText className="h-4 w-4 text-gray-600" />
              Order Notes
              {showNotes ? (
                <ChevronUp className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-auto" />
              )}
            </button>
            {showNotes && (
              <div className="mt-4">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any special instructions or notes..."
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Order will be created with status: Pending</span>
            </div>
            {orderForm.items?.length ? (
              <Badge variant="outline" className="text-green-600 border-green-200">
                {orderForm.items.length} item{orderForm.items.length > 1 ? "s" : ""} • MYR{" "}
                {orderForm.total_amount.toFixed(2)}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateOrder}
              disabled={
                isCreating ||
                !orderForm.customer_name ||
                !orderForm.phone_number ||
                !orderForm.items?.length
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}