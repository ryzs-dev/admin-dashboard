'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Printer,
  Download,
  Mail,
  MoreVertical,
  Package,
  User,
  MapPin,
  Box,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order } from './types';
import { Label } from '@/components/ui/label';
import CreateShipmentDialog from '../parcel-daily/CreateShipmentDialog';
import TrackingCardTemplate from '../tracking/TrackingCardTemplate';
import { useRouter } from 'next/navigation';

const OrderTemplate = ({ order }: { order: Order }) => {
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false);
  console.log(order);

  const router = useRouter();

  //   const shipping = 15.0;

  const total = order.total_amount;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full mx-auto py-10 px-6 space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {order.order_number}
              </h1>
              <p className="text-sm text-gray-500">{order.order_date}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* <DropdownMenuItem>
                  <Printer className="h-4 w-4 mr-2" /> Print
                </DropdownMenuItem> */}
                {/* <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" /> Download Invoice
                </DropdownMenuItem> */}
                {/* <DropdownMenuItem>
                  <Mail className="h-4 w-4 mr-2" /> Email Customer
                </DropdownMenuItem> */}
                <DropdownMenuItem onClick={() => setShipmentDialogOpen(true)}>
                  <Box className="h-4 w-4 mr-2" /> Create Shipment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ORDER SUMMARY — span 2/3 */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Package className="h-4 w-4 text-gray-500" />
                  Items Ordered
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start border-b border-gray-100 pb-3 last:border-none"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.products?.name}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">MYR {item.products?.price} </p>
                      <p className="text-gray-500 text-xs">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="pt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>MYR {total?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-semibold text-gray-900">
                    <span>Total</span>
                    <span>MYR {total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CUSTOMER & SHIPPING INFO — span 1/3 */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <User className="h-4 w-4 text-gray-500" />
                  Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Label>Name:</Label>
                  <p>{order.customers?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Email:</Label>
                  <p>{order.customers?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Phone:</Label>
                  <p>{order.customers?.phone_number}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{order.addresses?.full_address}</p>
                  <p>{order.addresses?.city}</p>
                  <p>{order.addresses?.country}</p>
                </div>
              </CardContent>
            </Card>

            <TrackingCardTemplate orderId={order.id} />
          </div>
        </div>
      </div>

      <CreateShipmentDialog
        order={order}
        contentValue={total}
        isOpen={shipmentDialogOpen}
        onOpenChange={setShipmentDialogOpen}
      />
    </div>
  );
};

export default OrderTemplate;
