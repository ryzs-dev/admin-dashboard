'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UpdateLineItemsInput } from '@/types/order';
import { Order } from '@/components/modules/order/types';
import { UUID } from 'crypto';
import { useProducts } from '@/hooks/useProducts';
import { Trash } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product } from '@/components/modules/products/types';

interface EditOrderDialogProps {
  order: Order;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateOrder: (data: UpdateLineItemsInput) => Promise<void>;
}

const EditOrderDialog = ({
  order,
  isOpen,
  onOpenChange,
  onUpdateOrder,
}: EditOrderDialogProps) => {
  const { products } = useProducts();
  const [lineItems, setLineItems] = useState(order.order_items);

  if (!products) {
    return null;
  }

  const handleQuantityChange = (id: string, quantity: number) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (id?: string, productId?: string) => {
    setLineItems((prev) =>
      prev.filter((item) => item.id !== id && item.product_id !== productId)
    );
  };

  const handleAddProduct = (productId: UUID) => {
    const product = products.find((p: Product) => p.id === productId);
    if (!product) return;

    // Avoid adding duplicate
    if (lineItems.find((item) => item.id === productId)) return;

    setLineItems((prev) => [
      ...prev,
      {
        order_id: order.id,
        product_id: product.id,
        id: product.id, // using product id as line item id if creating new
        products: product,
        quantity: 1,
      },
    ]);
  };

  const handleSave = async () => {
    const updateData: UpdateLineItemsInput = {
      line_items: lineItems.map((item) => ({
        product_id: item.product_id as UUID, // always real product ID
        quantity: item.quantity,
      })),
      total_amount: lineItems.reduce(
        (sum, item) => sum + item.quantity * item.products.price,
        0
      ),
    };

    console.log(updateData);

    await onUpdateOrder(updateData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {lineItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2"
            >
              <span>{item.products.name}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(item.id, parseInt(e.target.value))
                  }
                  className="w-20"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Select onValueChange={handleAddProduct} defaultValue="">
              <SelectTrigger>
                <SelectValue placeholder="Select product to add" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product: Product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderDialog;
