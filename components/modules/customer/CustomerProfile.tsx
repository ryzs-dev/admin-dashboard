'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  Facebook,
  Mail,
  MapPin,
  Pencil,
  Phone,
} from 'lucide-react';
import { UUID } from 'crypto';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerById } from '@/hooks/useCustomer';
import { CustomerInput } from '@/types/customer';
import { formatCurrency } from '@/lib/utils/currency';
import { formatPhone } from '@/lib/utils/phone';
import { APP_TIMEZONE } from '@/lib/utils/date';
import { cn } from '@/lib/utils';
import { getOrderShipmentStatus } from '../order/OrderTableColumns';
import CustomerStatsCard from './CustomerStatsCard';
import EditCustomerDialog from './EditCustomerDialog';
import { COUNTRY_LABELS, CountryCode } from './types';

interface CustomerProfileProps {
  customer_id: UUID;
  update?: (id: UUID, data: Partial<CustomerInput>) => Promise<unknown>;
}

type CustomerOrder = {
  id: UUID;
  order_number: string;
  order_date: string;
  total_amount: number;
  order_items?: { quantity: number }[];
  order_tracking?: { status?: string | null; tracking_number?: string; courier?: string }[];
};

type CustomerAddress = {
  id: UUID;
  full_address: string;
  postcode?: string;
  city?: string;
  state?: string;
  country?: string;
  created_at: string;
};

type CustomerDetail = {
  id: UUID;
  name: string;
  phone_number: string;
  email?: string | null;
  fb_name?: string | null;
  repeat_customer: CustomerInput['repeat_customer'];
  created_at: string;
  country?: CountryCode;
  orders?: CustomerOrder[];
  addresses?: CustomerAddress[];
  total_purchases?: number;
  amount_spent?: number;
};

const ADDRESS_PREVIEW_COUNT = 3;

function toDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00+08:00`);
  // Supabase timestamps come back without an offset but are stored in UTC.
  return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-MY', {
    timeZone: APP_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysAgo(value?: string) {
  if (!value) return undefined;
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 60) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function initials(name?: string) {
  const parts = (name ?? '').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function addressKey(address: CustomerAddress) {
  return `${address.full_address} ${address.postcode ?? ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function CustomerProfile({ customer_id, update }: CustomerProfileProps) {
  const { customer: data, isLoading, isError, refresh } = useCustomerById(customer_id);
  const customer = data as CustomerDetail;
  const [editing, setEditing] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  const addresses = useMemo(() => {
    const seen = new Set<string>();
    return (customer?.addresses ?? []).filter((address) => {
      if (!address.full_address?.trim()) return false;
      const key = addressKey(address);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [customer?.addresses]);

  if (isError) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card px-6 py-16 text-center">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <p className="font-medium">Couldn’t load this customer</p>
          <p className="text-sm text-muted-foreground">
            They may have been deleted, or the server is unreachable.
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refresh()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !customer?.id) return <ProfileSkeleton />;

  const orders = customer.orders ?? [];
  const totalOrders = customer.total_purchases ?? orders.length;
  const totalSpent =
    customer.amount_spent ?? orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const lastOrder = orders[0];
  const visibleAddresses = showAllAddresses
    ? addresses
    : addresses.slice(0, ADDRESS_PREVIEW_COUNT);

  const handleUpdate = async (values: Partial<CustomerInput>) => {
    if (!update) return;
    await update(customer.id, values);
    toast.success('Customer updated');
    await refresh();
  };

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {initials(customer.name)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {customer.name || 'Unnamed customer'}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {customer.country && (
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[11px] font-semibold',
                    customer.country === 'SG'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-sky-50 text-sky-700'
                  )}
                  title={COUNTRY_LABELS[customer.country]}
                >
                  {customer.country}
                </span>
              )}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  customer.repeat_customer === 'returning'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {customer.repeat_customer === 'returning' ? 'Returning' : 'New'}
              </span>
              {customer.created_at && <span>Customer since {formatDate(customer.created_at)}</span>}
            </div>
          </div>
        </div>
        {update && (
          <Button variant="outline" onClick={() => setEditing(true)} className="shrink-0">
            <Pencil className="h-4 w-4" />
            Edit customer
          </Button>
        )}
      </div>

      <CustomerStatsCard
        totalOrders={totalOrders}
        totalSpent={totalSpent}
        lastOrderLabel={lastOrder ? formatDate(lastOrder.order_date) : undefined}
        lastOrderHint={lastOrder ? daysAgo(lastOrder.order_date) : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border bg-card lg:col-span-2">
          <div className="flex items-baseline justify-between border-b px-5 py-4">
            <h2 className="font-semibold">Order history</h2>
            <span className="text-sm text-muted-foreground">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>

          {orders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">Order</th>
                    <th className="px-3 py-2.5 font-medium">Date</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 text-right font-medium">Units</th>
                    <th className="px-5 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const status = getOrderShipmentStatus(order);
                    const StatusIcon = status.icon;
                    const units = (order.order_items ?? []).reduce(
                      (sum, item) => sum + (item.quantity || 0),
                      0
                    );
                    return (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-3">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-mono text-[13px] font-medium hover:text-primary hover:underline"
                          >
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                          {formatDate(order.order_date)}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            title={status.raw}
                            className={cn(
                              'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                              status.className
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                          {units || '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-medium tabular-nums">
                          {formatCurrency(order.total_amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              No orders yet.
            </p>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border bg-card">
            <h2 className="border-b px-5 py-4 font-semibold">Contact</h2>
            <dl className="divide-y text-sm">
              <ContactRow icon={Phone} label="Phone">
                <a
                  href={`https://wa.me/${customer.phone_number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono hover:text-primary hover:underline"
                >
                  {formatPhone(customer.phone_number)}
                </a>
              </ContactRow>
              <ContactRow icon={Mail} label="Email">
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="break-all hover:text-primary hover:underline">
                    {customer.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Not provided</span>
                )}
              </ContactRow>
              <ContactRow icon={Facebook} label="Facebook">
                {customer.fb_name || <span className="text-muted-foreground">Not provided</span>}
              </ContactRow>
            </dl>
          </section>

          <section className="rounded-xl border bg-card">
            <div className="flex items-baseline justify-between border-b px-5 py-4">
              <h2 className="font-semibold">Addresses</h2>
              {addresses.length > 0 && (
                <span className="text-sm text-muted-foreground">{addresses.length}</span>
              )}
            </div>
            {addresses.length ? (
              <ul className="divide-y">
                {visibleAddresses.map((address, index) => (
                  <li key={address.id} className="flex gap-3 px-5 py-3.5 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 space-y-1">
                      <p className="leading-snug">{address.full_address}</p>
                      <p className="text-xs text-muted-foreground">
                        {[address.postcode, address.city, address.state, address.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {index === 0 && (
                        <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          Latest
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No addresses saved.
              </p>
            )}
            {addresses.length > ADDRESS_PREVIEW_COUNT && (
              <button
                type="button"
                onClick={() => setShowAllAddresses((v) => !v)}
                className="w-full border-t px-5 py-2.5 text-sm font-medium text-primary hover:bg-muted/30"
              >
                {showAllAddresses ? 'Show fewer' : `Show all ${addresses.length}`}
              </button>
            )}
          </section>
        </div>
      </div>

      <EditCustomerDialog
        open={editing}
        onOpenChange={setEditing}
        customer={customer}
        onSubmit={handleUpdate}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/customers"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Customers
    </Link>
  );
}

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5">{children}</dd>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[106px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <div className="space-y-6">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
