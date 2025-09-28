'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useOrders } from '@/hooks/useOrders';
import { Order } from './types';
import { UUID } from 'crypto';
import AddTrackingModal from '../tracking/AddTrackingDialog';
import { OrderTrackingInput } from '../tracking/types';

interface OrderDetailsPageProps {
  orderId: UUID;
  onBack:() => void
}

export default function OrderDetailsPage({ orderId, onBack }: OrderDetailsPageProps) {

  const { getOrderById, createOrderTrackingByOrderId } = useOrders();
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddTracking = () => {
    setIsDialogOpen(true);
  }

  const handleSubmit = async (trackingData: OrderTrackingInput) => {
    try {
      await createOrderTrackingByOrderId(orderId, trackingData);
    } catch (error) {
      console.error('Error creating tracking:', error);
    }
  }

  useEffect(() => {
    async function fetchOrderDetails() {
      const {order} = await getOrderById(orderId);
      setFetchedOrder(order);
    }

    fetchOrderDetails();
  }, [orderId, getOrderById]);


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
        onSubmit={handleSubmit}
      />

      <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card className="mb-4">
          <div className="flex items-center gap-4 mb-4 p-6">
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
                Placed on {new Date(order.order_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
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
                    <div key={item.id} className="flex justify-between items-start p-6">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.products?.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
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
                    <div className='flex items-center gap-2'>
                      <Mail className="h-4 w-4" />
                      <span>{order?.customers?.email}</span>
                    </div>
                    {copied === "email" ? (
                      <CopyCheck className="h-4 w-4 text-green-500" />
                        ) : (
                      <Copy
                          className="h-4 w-4 text-gray-400 hover:cursor-pointer hover:text-gray-600 transition-colors"
                          onClick={handleCopy("email",order?.customers?.email)}
                        />
                      )}                  
                    </div>
                  <div className="flex items-center justify-between gap-2 text-sm text-gray-600 w-full">
                    <div className='flex items-center gap-2'>
                      <Phone className="h-4 w-4" />
                      <span>{order?.customers?.phone_number}</span>
                    </div>
                    {copied === "phone" ? (
                      <CopyCheck className="h-4 w-4 text-green-500" />
                        ) : (
                      <Copy
                          className="h-4 w-4 text-gray-400 hover:cursor-pointer hover:text-gray-600 transition-colors"
                          onClick={handleCopy("phone", order?.customers?.phone_number)}
                        />
                      )}                  
                  </div>
                  <div className='flex items-start justify-between gap-2 text-sm text-gray-600'>
                    <div className='flex items-start gap-2'>
                      <MapPin className="h-4 w-4" />
                      {!order?.addresses?.full_address ? ( <div>{" - "}</div>) : (
                        <div className='flex flex-col gap-1'>
                          <span>{order?.addresses?.full_address}</span>
                          <span>{order?.addresses?.postcode}</span>
                          <span>{order?.addresses?.country}</span>
                        </div>
                      )}
                    </div>
                    {copied === "address" ? (
                      <CopyCheck className="h-4 w-4 text-green-500" />
                        ) : (
                      <Copy
                          className="h-4 w-4 text-gray-400 hover:cursor-pointer hover:text-gray-600 transition-colors"
                          onClick={handleCopy("address",order?.addresses?.full_address)}
                        />
                    )}                   
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No tracking information</p>
                  <Button variant="outline" size="sm" onClick={handleAddTracking}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tracking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}