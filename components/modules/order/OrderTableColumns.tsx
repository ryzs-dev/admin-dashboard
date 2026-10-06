'use client';

import { Column, ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  MoreHorizontal,
  PackageOpen,
  Send,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react';
import { isMarketplaceOrder, MARKETPLACE_LABELS, Order } from './types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UUID } from 'crypto';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { courierLabel } from '../parcel-daily/couriers';
import { formatPhone } from '@/lib/utils/phone';

interface ColumnActions {
  onViewDetails: (orderId: string) => void;
  onDeleteOrder: (orderId: UUID) => void;
  onCopy: (value: string, label: string) => void;
  onSendTracking: (orderId: string) => void;
}

// Mirrors ORDER_STATUS_GROUPS in lunaa-agent's orders module.
const STATUS_GROUPS = {
  awaiting_pickup: [
    'pending',
    'pending pickup',
    'shipment data received',
    'sent',
    'read',
  ],
  in_transit: [
    'in transit',
    'delivering',
    'shipped',
    'parcel has been received',
    'shipment collected',
    'mainwaybill pickup',
  ],
  delivered: [
    'delivered',
    'successfully delivered',
    'delivery success',
    'special pod',
  ],
  problem: [
    'undelivered',
    'returned',
    'rto success',
    'return success',
    'return shipment was successfully delivered',
  ],
};

const STATUS_STYLES = {
  needs_shipment: {
    label: 'Needs shipment',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    icon: PackageOpen,
  },
  awaiting_pickup: {
    label: 'Awaiting pickup',
    className: 'bg-gray-100 text-gray-700 ring-gray-500/20',
    icon: Clock,
  },
  in_transit: {
    label: 'In transit',
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    icon: CheckCircle2,
  },
  problem: {
    label: 'Problem',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
    icon: AlertTriangle,
  },
} as const;

const MARKETPLACE_STYLES = {
  shopee: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  lazada: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

export function getOrderShipmentStatus(order: {
  source?: string | null;
  order_tracking?: { status?: string | null } | { status?: string | null }[] | null;
}) {
  if (order.source === 'shopee' || order.source === 'lazada') {
    return {
      label: `Ships via ${MARKETPLACE_LABELS[order.source]}`,
      className: MARKETPLACE_STYLES[order.source],
      icon: ShoppingBag,
      raw: undefined,
    };
  }
  const tracking = Array.isArray(order.order_tracking)
    ? order.order_tracking[0]
    : order.order_tracking ?? undefined;
  const raw = tracking?.status as string | undefined;
  if (!tracking) return { ...STATUS_STYLES.needs_shipment, raw };

  const value = (raw ?? '').toLowerCase();
  const group = (Object.keys(STATUS_GROUPS) as (keyof typeof STATUS_GROUPS)[]).find(
    (key) => STATUS_GROUPS[key].includes(value)
  );

  return { ...STATUS_STYLES[group ?? 'awaiting_pickup'], raw };
}

function getStatusStyle(order: Order) {
  return getOrderShipmentStatus(order);
}

function initials(name?: string) {
  const parts = (name ?? '').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function SortableHeader({
  column,
  label,
  align = 'left',
}: {
  column: Column<Order>;
  label: string;
  align?: 'left' | 'right';
}) {
  const sorted = column.getIsSorted();
  const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => {
        if (!sorted) column.toggleSorting(true);
        else if (sorted === 'desc') column.toggleSorting(false);
        else column.clearSorting();
      }}
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors hover:text-gray-900',
        sorted ? 'text-gray-900' : 'text-gray-500',
        align === 'right' && 'ml-auto'
      )}
    >
      {label}
      <Icon className={cn('h-3.5 w-3.5', !sorted && 'opacity-40')} />
    </button>
  );
}

const stopRowClick = (e: React.MouseEvent) => e.stopPropagation();

export const createColumns = (actions: ColumnActions): ColumnDef<Order>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
        aria-label="Select all orders on this page"
      />
    ),
    cell: ({ row }) => (
      <div onClick={stopRowClick}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(val) => row.toggleSelected(!!val)}
          aria-label={`Select order ${row.original.order_number || row.original.id}`}
        />
      </div>
    ),
    enableSorting: false,
    size: 40,
  },
  {
    id: 'created_at',
    header: ({ column }) => <SortableHeader column={column} label="Order" />,
    cell: ({ row }) => {
      const order = row.original;
      const orderNumber =
        order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`;
      const isRecent =
        Date.now() - new Date(order.created_at).getTime() < 24 * 60 * 60 * 1000;

      return (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-gray-900">
              {orderNumber}
            </span>
            {isRecent && (
              <span className="rounded bg-[#662d91]/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#662d91]">
                New
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(order.order_date ?? order.created_at).toLocaleDateString(
              'en-MY',
              { day: 'numeric', month: 'short', year: 'numeric' }
            )}
          </p>
        </div>
      );
    },
  },
  {
    id: 'customer',
    header: 'Customer',
    cell: ({ row }) => {
      const customer = row.original.customers;
      const marketplace = isMarketplaceOrder(row.original)
        ? MARKETPLACE_LABELS[row.original.source!]
        : null;
      const name = customer?.name || row.original.buyer_name;

      return (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#662d91]/[0.08] text-xs font-semibold text-[#662d91]">
            {initials(name ?? undefined)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {name || 'Guest customer'}
            </p>
            <p
              className={cn(
                'truncate text-xs',
                row.original.source === 'shopee'
                  ? 'text-orange-600'
                  : row.original.source === 'lazada'
                    ? 'text-blue-600'
                    : 'text-muted-foreground'
              )}
            >
              {marketplace ? `${marketplace} buyer` : formatPhone(customer?.phone_number) || '—'}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    id: 'items',
    header: 'Items',
    cell: ({ row }) => {
      const code = row.original.shipment_description?.trim();
      if (!code) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      const names = (row.original.order_items ?? []).map(
        (item) => `${item.products?.name ?? 'Item'} × ${item.quantity}`
      );

      return (
        <span
          title={names.join('\n') || undefined}
          className="block truncate font-mono text-sm text-gray-700"
        >
          {code}
        </span>
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const style = getStatusStyle(row.original);
      const Icon = style.icon;
      const showRaw =
        style.raw && style.raw.toLowerCase() !== style.label.toLowerCase();

      return (
        <span
          title={showRaw ? `Courier status: ${style.raw}` : undefined}
          className={cn(
            'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
            style.className
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {style.label}
        </span>
      );
    },
  },
  {
    id: 'tracking',
    header: 'Tracking',
    cell: ({ row }) => {
      const tracking = row.original.order_tracking;
      if (!tracking?.tracking_number) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }

      const courier = tracking.courier as string | undefined;

      return (
        <div className="min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              actions.onCopy(tracking.tracking_number, 'Tracking number');
            }}
            title="Copy tracking number"
            className="group flex max-w-full items-center gap-1 font-mono text-sm text-gray-900 transition-colors hover:text-[#662d91]"
          >
            <span className="truncate">{tracking.tracking_number}</span>
            <Copy className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
          <p className="truncate text-xs text-muted-foreground">
            {courierLabel(courier) || '—'}
            {tracking.message_status === 'sent' && ' · Tracking sent'}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: 'total_amount',
    header: ({ column }) => (
      <div className="flex">
        <SortableHeader column={column} label="Amount" align="right" />
      </div>
    ),
    cell: ({ row }) => (
      <p className="text-right text-sm font-medium text-gray-900">
        {formatCurrency(Number(row.original.total_amount ?? 0))}
      </p>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const order = row.original;
      const hasTracking = !!order.order_tracking?.tracking_number;

      return (
        <div className="flex justify-end" onClick={stopRowClick}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open order actions</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => actions.onViewDetails(order.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!hasTracking}
                onClick={() => actions.onSendTracking(order.id)}
              >
                <Send className="mr-2 h-4 w-4" />
                Send tracking to customer
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  actions.onCopy(order.order_number || order.id, 'Order number')
                }
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy order number
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => actions.onDeleteOrder(order.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    size: 48,
  },
];
