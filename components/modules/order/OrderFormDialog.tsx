import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Customer } from '../customer/types';
import { Order } from './types';
import { OrderInput, OrderItemsInput } from '@/types/order';
import { UUID } from 'crypto';
import { Product } from '../products/types';

type OrderFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrderInput) => void;
  initialData?: Order;
  customers: Customer[];
  products: Product[];
  trigger?: React.ReactNode;
};

export default function OrderFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  customers,
  products,
  trigger,
}: OrderFormDialogProps) {
  const [formData, setFormData] = useState<{
    customer_id: string;
    order_date: string;
    order_items: { product_id: string; quantity: number }[];
    total_amount: string;
    status: 'unpaid' | 'paid' | 'refunded';
    payment_method: string;
  }>({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    order_items: [{ product_id: '', quantity: 1 }],
    total_amount: '',
    status: 'unpaid',
    payment_method: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        customer_id: initialData.customer_id || '',
        order_date: initialData.order_date
          ? initialData.order_date.split('T')[0]
          : new Date().toISOString().split('T')[0],
        order_items:
          initialData.order_items?.length > 0
            ? initialData.order_items.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
              }))
            : [{ product_id: '', quantity: 1 }],
        total_amount: initialData.total_amount?.toString() || '',
        status: initialData.status || 'unpaid',
        payment_method: initialData.payment_method || '',
      });
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setFormData({
      customer_id: '',
      order_date: new Date().toISOString().split('T')[0],
      order_items: [{ product_id: '', quantity: 1 }],
      total_amount: '',
      status: 'unpaid',
      payment_method: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      newErrors.total_amount = 'Total amount must be greater than 0';
    }
    if (
      formData.order_items.some(
        (item) => !item.product_id || item.quantity <= 0
      )
    ) {
      newErrors.order_items =
        'All items must have a valid product ID and quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const orderData: OrderInput = {
      customer_id: formData.customer_id as UUID,
      order_date: new Date(formData.order_date),
      order_items: formData.order_items.map((item) => ({
        product_id: item.product_id as UUID,
        quantity: item.quantity,
      })) as OrderItemsInput[],
      total_amount: parseFloat(formData.total_amount),
      status: formData.status,
      payment_method: formData.payment_method,
    };

    onSubmit(orderData);
  };

  const addOrderItem = () => {
    setFormData((prev) => ({
      ...prev,
      order_items: [...prev.order_items, { product_id: '', quantity: 1 }],
    }));
  };

  const removeOrderItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      order_items: prev.order_items.filter((_, i) => i !== index),
    }));
  };

  const updateOrderItem = (
    index: number,
    field: 'product_id' | 'quantity',
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      order_items: prev.order_items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  // const selectedCustomer = customers.find(c => c.id === formData.customer_id);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="w-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Order' : 'Create New Order'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Update the order details below.'
              : 'Fill in the order details below.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 grid grid-cols-2 gap-4">
          {/* Customer ID/ Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select
              value={formData.customer_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, customer_id: value }))
              }
            >
              <SelectTrigger className="w-full" id="customer">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.phone_number} - ( {customer.name} )
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customer_id && (
              <p className="text-sm text-red-500">{errors.customer_id}</p>
            )}
          </div>

          {/* Order Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="order_date">Order Date</Label>
            <div className="flex w-full">
              <Input
                id="order_date"
                type="date"
                value={formData.order_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    order_date: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Order Items *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOrderItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {formData.order_items.map((item, index) => {
                // Filter products that are not already selected in other rows
                const availableProducts = products.filter(
                  (p) =>
                    !formData.order_items.some(
                      (oi, i) => i !== index && oi.product_id === p.id
                    )
                );

                return (
                  <div key={index} className="flex gap-2 items-center">
                    <Select
                      value={item.product_id}
                      onValueChange={(value) =>
                        updateOrderItem(index, 'product_id', value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} - ( MYR {p.price.toFixed(2)} )
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) =>
                        updateOrderItem(
                          index,
                          'quantity',
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-20"
                      min="1"
                    />

                    {formData.order_items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOrderItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            {errors.order_items && (
              <p className="text-sm text-red-500">{errors.order_items}</p>
            )}
          </div>

          {/* Total Amount */}
          <div className="grid gap-2">
            <Label htmlFor="total_amount">Total Amount *</Label>
            <Input
              id="total_amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.total_amount}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  total_amount: e.target.value,
                }))
              }
            />
            {errors.total_amount && (
              <p className="text-sm text-red-500">{errors.total_amount}</p>
            )}
          </div>

          {/* Peyment Status */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'unpaid' | 'paid' | 'refunded') =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-full" id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-2 col-span-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Input
              className="w-full"
              id="payment_method"
              placeholder="e.g., Cash, Card, Bank Transfer"
              value={formData.payment_method}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  payment_method: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {initialData ? 'Update Order' : 'Create Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
