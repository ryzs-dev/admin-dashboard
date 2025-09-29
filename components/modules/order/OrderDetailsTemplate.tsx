"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Truck,
  Plus,
  Copy,
  CopyCheck,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOrders, useOrderTracking } from "@/hooks/useOrders";
import { Order } from "./types";
import { UUID } from "crypto";
import AddTrackingModal from "../tracking/AddTrackingDialog";
import { OrderTracking, OrderTrackingInput } from "../tracking/types";
import { TrackingList } from "../tracking/TrackingList";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import OrderFormDialog from "./OrderFormDialog";
import { useCustomer } from "@/hooks/useCustomer";
import { useProducts } from "@/hooks/useProducts";
import { OrderInput } from "@/types/order";
import { DeleteDialog } from "../utils/ui/DeleteDialog";

interface OrderDetailsPageProps {
  orderId: UUID;
  onBack: () => void;
}

export default function OrderDetailsPage({
  orderId,
  onBack,
}: OrderDetailsPageProps) {
  const { getOrderById, updateOrder, deleteOrder, refresh } = useOrders();

  const { createTracking, getTracking, refreshOrderTracking } =
    useOrderTracking(orderId);

  const { customers } = useCustomer({ limit: 100 });
  const { products } = useProducts();

  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [trackings, setTrackings] = useState<OrderTracking[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const handleAddTracking = () => {
    setIsDialogOpen(true);
  };

  const handleSubmitOrder = async (data: OrderInput) => {
    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id as UUID, data);
      }
      refresh();
      setIsOrderDialogOpen(false);
      setEditingOrder(null);
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };

  const handleSubmitTracking = async (trackingData: OrderTrackingInput) => {
    try {
      await createTracking(trackingData);
      await refreshOrderTracking();
    } catch (error) {
      console.error("Error creating tracking:", error);
    }
  };

  useEffect(() => {
    async function fetchOrderDetails() {
      const { order } = await getOrderById(orderId);
      setFetchedOrder(order);
    }

    fetchOrderDetails();
  }, [orderId, getOrderById]);

  useEffect(() => {
    async function fetchTrackingInfo() {
      const { tracking_entries } = await getTracking(orderId);
      setTrackings(tracking_entries || []);
    }

    fetchTrackingInfo();
  }, [getTracking, orderId]);

  if (!fetchedOrder) {
    return <div>Loading...</div>;
  }

  const order = fetchedOrder;

  const handleCopy = (key: string, text?: string) => () => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000); // reset after 2s
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsOrderDialogOpen(true);
  };

  const handleDeleteOrder = (id: UUID) => {
    try {
      deleteOrder(id);
      refresh();
      onBack();
    } catch {
      console.error("Error deleting order");
    }
  };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'cancelled': return 'destructive';
  //     case 'refunded': return 'outline';
  //     case 'completed': return 'default';
  //     default: return 'secondary';
  //   }
  // };

  // const getStatusDotColor = (status: string) => {
  //   switch (status) {
  //     case 'completed': return 'bg-green-500';
  //     case 'cancelled': return 'bg-red-500';
  //     case 'refunded': return 'bg-blue-500';
  //     default: return 'bg-gray-400';
  //   }
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      <AddTrackingModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        order={order}
        onSubmit={handleSubmitTracking}
      />

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

      <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4 px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Order {order.id}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Placed on{" "}
                  {new Date(order.order_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
                <DropdownMenuItem onClick={() => handleEdit(order)}>
                  Edit Order
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <DropdownMenuItem asChild>
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
                        <p className="font-medium">RM {item.products?.price}</p>
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

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span>{order.payment_method}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.timeline.map((event, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className={`w-3 h-3 rounded-full mt-0.5 ${getStatusDotColor(event.status)}`} />
                      <div className="flex-1">
                        <p className="font-medium">{event.action}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            {/* <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Button className="w-full" onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Order
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Invoice
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>
              </CardContent>
            </Card> */}

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">{order?.customers?.name}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{order?.customers?.email}</span>
                    </div>
                    {copied === "email" ? (
                      <CopyCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy
                        className="h-4 w-4 text-gray-400 hover:cursor-pointer hover:text-gray-600 transition-colors"
                        onClick={handleCopy("email", order?.customers?.email)}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm text-gray-600 w-full">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{order?.customers?.phone_number}</span>
                    </div>
                    {copied === "phone" ? (
                      <CopyCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy
                        className="h-4 w-4 text-gray-400 hover:cursor-pointer hover:text-gray-600 transition-colors"
                        onClick={handleCopy(
                          "phone",
                          order?.customers?.phone_number
                        )}
                      />
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4">
                        <MapPin className="h-4 w-4" />
                      </div>
                      {!order?.addresses?.full_address ? (
                        <div>{" - "}</div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span>{order?.addresses?.full_address}</span>
                          <span>{order?.addresses?.postcode}</span>
                          <span>{order?.addresses?.country}</span>
                        </div>
                      )}
                    </div>
                    <div className="w-4 h-4">
                      {copied === "address" ? (
                        <CopyCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy
                          className="h-4 w-4 text-gray-400 hover:cursor-pointer hover:text-gray-600 transition-colors"
                          onClick={handleCopy(
                            "address",
                            order?.addresses?.full_address
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracking */}
            <Card id="tracking-card">
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                      >
                        <MoreHorizontalIcon className="h-4 w-4 text-gray-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleAddTracking}>
                        <Plus className="h-4 w-4" />
                        <span>Add</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => console.log("editing tracking")}
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => console.log("deleting tracking")}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {trackings ? (
                  <TrackingList trackings={trackings} />
                ) : (
                  <div className="text-center py-6">
                    <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-3">
                      No tracking information
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddTracking}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tracking
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
