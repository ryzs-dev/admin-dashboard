'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Box,
  MapPin,
  MessageSquareText,
  Pencil,
  Plus,
  Send,
  Trash,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isMarketplaceOrder, MARKETPLACE_LABELS, Order } from './types';
import CreateShipmentDialog from '../parcel-daily/CreateShipmentDialog';
import TrackingCardTemplate from '../tracking/TrackingCardTemplate';
import { useRouter } from 'next/navigation';
import { useMessage } from '@/hooks/useMessage';
import { UUID } from 'crypto';
import { useOrders } from '@/hooks/useOrders';
import { toast } from 'sonner';
import DeleteDialog from '../alert/DeleteDialog';
import EditOrderDialog from '@/components/modules/order/EditOrderItemsDialog';
import { createAddress, updateAddress } from '@/lib/api/address';
import { updateOrder } from '@/lib/api/order';
import EditAddressDialog from '@/components/modules/order/EditAddressDialog';
import Link from 'next/link';
import { getOrderShipmentStatus } from './OrderTableColumns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { formatFriendlyDateTime } from '@/lib/utils/date';
import { formatPhone } from '@/lib/utils/phone';

function formatOrderDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function labelize(value?: string | null) {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function addressExtras(address: NonNullable<Order['addresses']>) {
  const full = address.full_address?.toLowerCase() ?? '';
  return [address.postcode, address.city, address.state, address.country]
    .filter((part) => part && !full.includes(part.toLowerCase()))
    .join(', ');
}

function initials(name?: string) {
  const parts = (name ?? '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

const OrderTemplate = ({ order }: { order: Order }) => {
  const router = useRouter();
  const { order_items } = order;
  const { sendTrackingInfo } = useMessage();
  const { updateLineItems, deleteOrder } = useOrders();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(false);
  const [editAddressOpen, setEditAddressOpen] = useState(false);

  const tracking = (
    Array.isArray(order.order_tracking)
      ? order.order_tracking[0]
      : order.order_tracking
  ) as Order['order_tracking'];

  const sendTracking = () => {
    sendTrackingInfo({
      name: order.customers?.name || '',
      phone: order.customers?.phone_number || '',
      tracking: tracking?.tracking_number || '',
      courier: tracking?.courier || '',
    });
  };

  const handleDeleteOrder = async (orderId: UUID) => {
    setIsDeleting(true);

    try {
      await deleteOrder(orderId);
      toast.success('Order deleted');
      router.push('/orders');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete order');
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };

  const hasTracking = Boolean(tracking);

  const shipment = getOrderShipmentStatus(order);
  const marketplace = isMarketplaceOrder(order)
    ? MARKETPLACE_LABELS[order.source!]
    : null;
  const ShipmentIcon = shipment.icon;
  const placedOn = formatOrderDate(order.order_date || order.created_at);
  const description = [
    placedOn && `Placed ${placedOn}`,
    order.created_at && `Created ${formatFriendlyDateTime(order.created_at)}`,
    labelize(order.payment_method),
    order.agent_name && `Taken by ${order.agent_name}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const subtotal = order_items.reduce(
    (sum, item) => sum + Number(item.products?.price ?? 0) * item.quantity,
    0
  );
  const total = Number(order.total_amount) || 0;
  const adjustment = total - subtotal;
  const units = order_items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Orders
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-mono text-2xl font-semibold tracking-tight">
                  {order.order_number}
                </h1>
                <span
                  title={
                    shipment.raw &&
                    shipment.raw.toLowerCase() !== shipment.label.toLowerCase()
                      ? `Courier status: ${shipment.raw}`
                      : undefined
                  }
                  className={cn(
                    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                    shipment.className
                  )}
                >
                  <ShipmentIcon className="h-3.5 w-3.5" />
                  {shipment.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {marketplace ? (
                <p className="max-w-xs text-sm text-muted-foreground">
                  Synced from the order sheet. Edit or remove it there and the
                  change shows up here within 15 minutes.
                </p>
              ) : !hasTracking ? (
                <Button
                  onClick={() => setShipmentDialogOpen(true)}
                  className="gap-1.5"
                >
                  <Box className="h-4 w-4" />
                  Create shipment
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={sendTracking}
                  className="gap-1.5 bg-background"
                >
                  <Send className="h-4 w-4" />
                  Send tracking
                </Button>
              )}
              {!marketplace && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setEditOrder(true)}
                    className="gap-1.5 bg-background"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete order"
                    onClick={() => setOpen(true)}
                  >
                    <Trash className="h-4 w-4 text-red-600" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="gap-0 overflow-hidden py-0">
              <CardHeader className="flex flex-row items-center justify-between border-b py-4">
                <CardTitle className="text-base font-semibold">Items</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {order_items.length}{' '}
                  {order_items.length === 1 ? 'product' : 'products'} · {units}{' '}
                  {units === 1 ? 'unit' : 'units'}
                </span>
              </CardHeader>
              <CardContent className="px-0">
                {order_items.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <th className="px-5 py-3 font-medium">Product</th>
                        <th className="px-5 py-3 text-right font-medium">
                          Qty
                        </th>
                        <th className="px-5 py-3 text-right font-medium">
                          Price
                        </th>
                        <th className="px-5 py-3 text-right font-medium">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order_items.map((item) => {
                        const price = Number(item.products?.price ?? 0);
                        const isFree = price === 0;
                        return (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {item.products?.name ?? 'Item'}
                                </span>
                                {isFree && (
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                    Free gift
                                  </span>
                                )}
                              </div>
                              {item.products?.code && (
                                <span className="font-mono text-xs text-muted-foreground">
                                  {item.products.code}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                              {item.quantity}
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                              {isFree ? '—' : formatCurrency(price)}
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums">
                              {isFree
                                ? '—'
                                : formatCurrency(price * item.quantity)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No items on this order.
                  </p>
                )}
                <dl className="space-y-2 border-t bg-muted/40 px-5 py-4 text-sm">
                  {Math.abs(adjustment) >= 0.01 && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <dt>Subtotal at list price</dt>
                        <dd className="tabular-nums">
                          {formatCurrency(subtotal)}
                        </dd>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <dt>
                          {marketplace
                            ? `Discounts & ${marketplace} fees`
                            : adjustment < 0
                              ? 'Bundle discount'
                              : 'Adjustment'}
                        </dt>
                        <dd
                          className={cn(
                            'tabular-nums',
                            adjustment < 0 && 'text-emerald-700'
                          )}
                        >
                          {adjustment < 0 ? '−' : '+'}
                          {formatCurrency(Math.abs(adjustment))}
                        </dd>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="font-medium">Order total</dt>
                    <dd className="text-lg font-semibold tabular-nums">
                      {formatCurrency(total)}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <TrackingCardTemplate
              orderId={order.id}
              marketplace={marketplace}
            />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {marketplace ? `${marketplace} buyer` : 'Customer'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {marketplace ? (
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {initials(order.buyer_name ?? undefined)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {order.buyer_name || 'Unknown buyer'}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        From the order sheet. Contact the buyer in {marketplace}
                        .
                      </span>
                    </span>
                  </div>
                ) : (
                  <>
                    <Link
                      href={`/customers/${order.customers?.id}`}
                      className="flex items-center gap-3 rounded-lg transition-colors hover:text-primary"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {initials(order.customers?.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {order.customers?.name || 'Unknown'}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          View profile
                        </span>
                      </span>
                    </Link>
                    <dl className="mt-4 space-y-3 border-t pt-4 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Phone</dt>
                        <dd className="text-right">
                          {formatPhone(order.customers?.phone_number) || '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Email</dt>
                        <dd className="max-w-[14rem] truncate text-right">
                          {order.customers?.email || '—'}
                        </dd>
                      </div>
                    </dl>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Shipping address
                </CardTitle>
                {!marketplace && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-muted-foreground"
                    onClick={() => setEditAddressOpen(true)}
                  >
                    {order.addresses ? (
                      <Pencil className="h-3.5 w-3.5" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    {order.addresses ? 'Edit' : 'Add'}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {order.addresses ? (
                  <address className="space-y-1 text-sm not-italic leading-relaxed">
                    <p className="whitespace-pre-line">
                      {order.addresses.full_address}
                    </p>
                    {addressExtras(order.addresses) && (
                      <p className="text-muted-foreground">
                        {addressExtras(order.addresses)}
                      </p>
                    )}
                  </address>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No address on this order.
                  </p>
                )}
              </CardContent>
            </Card>

            {order.shipment_description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                    {marketplace ? 'Order code' : 'WhatsApp order code'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="break-all rounded-lg bg-muted/60 px-3 py-2 font-mono text-sm">
                    {order.shipment_description}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {marketplace
                      ? 'From the shipment description column in the order sheet.'
                      : 'The line the items were read from. Also used as the parcel description.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <CreateShipmentDialog
        order={order}
        contentValue={order.total_amount}
        isOpen={shipmentDialogOpen}
        onOpenChange={setShipmentDialogOpen}
      />

      <EditOrderDialog
        order={order}
        isOpen={editOrder}
        onOpenChange={setEditOrder}
        onUpdateOrder={async (data) => {
          await updateLineItems(order.id, data);
          toast.success('Order updated');
          router.refresh();
        }}
      />

      <EditAddressDialog
        address={order.addresses}
        open={editAddressOpen}
        onOpenChange={setEditAddressOpen}
        onSubmit={async (data) => {
          if (order.addresses?.id) {
            await updateAddress(order.addresses.id as UUID, data);
          } else {
            const created = await createAddress({
              ...(data as Required<typeof data>),
              customer_id: order.customer_id,
            });
            await updateOrder(order.id, { address_id: created.address.id });
          }
          toast.success(order.addresses ? 'Address updated' : 'Address added');
          router.refresh();
        }}
      />

      <DeleteDialog
        open={open}
        setOpen={setOpen}
        isLoading={isDeleting}
        onConfirm={handleDeleteOrder.bind(null, order.id)}
        title="Delete order?"
        description="This action cannot be undone. The order will be permanently removed."
      />
    </div>
  );
};

export default OrderTemplate;
