'use client';

import React, { useState } from 'react';
import { Plus, RefreshCw, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOrders } from '@/hooks/useOrders';
import { useCustomer } from '@/hooks/useCustomer';
import OrderFormDialog from '@/components/modules/order/OrderFormDialog';
import { Order } from '@/components/modules/order/types';
import { OrderInput } from '@/types/order';
import OrderTable from '@/components/modules/order/OrderTable';
import { useProducts } from '@/hooks/useProducts';
import { bulkDeleteOrders } from '@/lib/api/order';

export default function OrdersPage() {
  const {
    orders,
    pagination,
    isLoading,
    isError,
    refresh,
    createOrder,
    updateOrder,
  } = useOrders({
    limit: 100,
    offset: 0,
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const { products } = useProducts();
  const { customers } = useCustomer({ limit: 1000 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const handleSubmit = async (data: OrderInput) => {
    try {
      await createOrder(data);
      refresh();
      setIsDialogOpen(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleNewOrder = () => {
    setEditingOrder(null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load orders. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-4">Orders</h1>
          <p className="text-muted-foreground">
            Manage your orders and track their status
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleNewOrder}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Order Form Dialog */}
      <OrderFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingOrder(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingOrder || undefined}
        customers={customers || []}
        products={products || []}
      />

      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-96">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first order
            </p>
            <Button onClick={handleNewOrder}>
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <OrderTable
            orders={orders}
            pagination={pagination}
            bulkDeleteOrders={bulkDeleteOrders}
            refresh={async () => {
              await refresh();
            }}
            updateOrder={updateOrder}
          />
        </div>
      )}
    </div>
  );
}
