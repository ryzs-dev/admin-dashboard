'use client';

import React, { useEffect, useState } from 'react';
import { MoreHorizontalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useOrders } from '@/hooks/useOrders';
import { Order } from './types';
import { UUID } from 'crypto';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import OrderFormDialog from './OrderFormDialog';
import { useCustomer } from '@/hooks/useCustomer';
import { useProducts } from '@/hooks/useProducts';
import { OrderInput } from '@/types/order';
import { DeleteDialog } from '../utils/ui/DeleteDialog';
import TrackingCardTemplate from '../tracking/TrackingCardTemplate';
import CustomerCardTemplate from './customer/CustomerCardTemplate';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import CreateShipmentDialog from '../parcel-daily/CreateShipmentDialog';
import { useParcelDaily } from '@/hooks/useParcelDaily';

interface OrderDetailsPageProps {
  orderId: UUID;
  onBack: () => void;
}

export default function OrderDetailsPage({
  orderId,
  onBack,
}: OrderDetailsPageProps) {
  const { createParcelDailyShipment } = useParcelDaily();

  const { fetchOrderById, updateOrder, deleteOrder } = useOrders();

  const { customers } = useCustomer({ limit: 100 });
  const { products } = useProducts();

  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isCreateShipmentOpen, setIsCreateShipmentOpen] = useState(false);
  const handleCreateShipment = () => {
    setIsCreateShipmentOpen(true);
  };

  const handleSubmitOrder = async (data: OrderInput) => {
    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id as UUID, data);
      }
      setIsOrderDialogOpen(false);
      setEditingOrder(null);
      toast.success('Order saved successfully');
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  useEffect(() => {
    async function fetchOrderDetails() {
      const { order } = await fetchOrderById(orderId);
      setFetchedOrder(order);
    }

    fetchOrderDetails();
  }, [orderId, fetchOrderById]);

  if (!fetchedOrder) {
    return <div>Loading...</div>;
  }

  const order = fetchedOrder;

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsOrderDialogOpen(true);
  };

  const handleDeleteOrder = (id: UUID) => {
    try {
      deleteOrder(id);
      onBack();
    } catch {
      console.error('Error deleting order');
    }
  };

  if (!fetchedOrder) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {isOrderDialogOpen && (
        <OrderFormDialog
          isOpen={isOrderDialogOpen}
          onClose={() => setIsOrderDialogOpen(false)}
          onSubmit={handleSubmitOrder}
          initialData={editingOrder || undefined}
          customers={customers || []}
          products={products || []}
        />
      )}

      <CreateShipmentDialog
        isOpen={isCreateShipmentOpen}
        onClose={() => setIsCreateShipmentOpen(false)}
        order={order}
        contentValue={order.total_amount}
        createParcelDailyShipment={createParcelDailyShipment}
      />

      <div className="max-w-screen mx-auto space-y-6">
        <div className="mx-auto px-4 py-6 ">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.back();
                  }}
                >
                  Orders
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{order.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {/* Header */}
          <Card className="my-6">
            <div className="flex items-center justify-between mb-4 px-4">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Order {order.id}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Placed on {order.order_date}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <MoreHorizontalIcon className="h-4 w-4 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => handleCreateShipment()}>
                    Create Shipment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(order)}>
                    Edit Order
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <DeleteDialog
                      title="Delete Order"
                      description="Are you sure you want to delete this order?"
                      onConfirm={() => handleDeleteOrder(order.id as UUID)}
                    >
                      {({ open }) => (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 focus:text-red-600"
                          onClick={open}
                        >
                          Delete Order
                        </Button>
                      )}
                    </DeleteDialog>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-start p-6"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {item.products?.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right ">
                          <p className="font-medium">
                            RM {item.products?.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>RM {order.total_amount}</span>
                    </div>
                    {/* <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>${order.summary.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>${order.summary.tax.toFixed(2)}</span>
                  </div> */}
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>RM {order.total_amount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Customer Information */}
              <CustomerCardTemplate order={order} />

              {/* Tracking */}
              <TrackingCardTemplate orderId={orderId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
