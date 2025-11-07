'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpDown,
  CheckCircle,
  Clock,
  Package,
  Truck,
  XCircle,
  MoreHorizontal,
  Eye,
  Copy,
  Send,
  ExternalLink,
} from 'lucide-react';
import { Order } from './types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ColumnActions {
  onViewDetails: (orderId: string) => void;
  onCreateShipment: (orderId: string) => void;
  onCopyOrderId: (orderId: string) => void;
  onTrackShipment?: (trackingNumber: string) => void;
}

// Status configuration for better visual feedback
const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  'in transit': {
    label: 'In Transit',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Package,
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
} as const;

export const createColumns = (actions: ColumnActions): ColumnDef<Order>[] => [
  // Selection column
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
          aria-label="Select all orders"
          className="data-[state=checked]:bg-blue-600"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(val) => row.toggleSelected(!!val)}
          aria-label={`Select order ${row.original.order_number || row.original.id}`}
          className="data-[state=checked]:bg-blue-600"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },

  // Order ID & Date column
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 hover:bg-transparent font-semibold flex items-center cursor-pointer"
      >
        Order ID
        <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
      </div>
    ),
    cell: ({ row }) => {
      const orderNumber =
        row.original.order_number ||
        `ORD-${row.original.id.slice(0, 8).toUpperCase()}`;
      const orderDate = new Date(row.original.order_date);
      const isRecent = Date.now() - orderDate.getTime() < 24 * 60 * 60 * 1000; // Last 24h

      return (
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.onCopyOrderId(row.original.id);
                    }}
                    className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors font-mono group flex items-center gap-1"
                  >
                    {orderNumber}
                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to copy order ID</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isRecent && (
              <Badge
                variant="outline"
                className="text-xs px-1.5 py-0 h-5 bg-blue-50 text-blue-700 border-blue-200"
              >
                New
              </Badge>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {orderDate.toLocaleDateString('en-MY', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      );
    },
    size: 180,
  },

  // Customer column with avatar placeholder
  {
    accessorKey: 'customers.name',
    header: 'Customer',
    cell: ({ row }) => {
      const customer = row.original.customers;
      const initials =
        customer?.name
          ?.split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'G';

      return (
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>

          {/* Customer info */}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm font-medium text-gray-900 truncate cursor-default">
                    {customer?.name || 'Guest Customer'}
                  </span>
                </TooltipTrigger>
                {customer?.name && (
                  <TooltipContent>
                    <p>{customer.name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-gray-500 truncate cursor-default">
                    {customer?.email || 'No email provided'}
                  </span>
                </TooltipTrigger>
                {customer?.email && (
                  <TooltipContent>
                    <p>{customer.email}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      );
    },
    size: 220,
  },

  // Status column with visual badges
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status =
        row.original.order_tracking?.[0]?.status.toLowerCase() as keyof typeof STATUS_CONFIG;
      console.log('Order Status:', status);
      const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
      const Icon = config.icon;

      return (
        <Badge
          variant="outline"
          className={`${config.color} border font-medium flex items-center gap-1.5 w-fit`}
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
    size: 120,
  },

  // Tracking column with interactive elements
  {
    accessorKey: 'order_tracking',
    header: 'Tracking',
    cell: ({ row }) => {
      const tracking = row.original.order_tracking?.[0];

      if (!tracking) {
        return (
          <div className="flex items-center gap-2 text-gray-400">
            <Package className="h-4 w-4" />
            <span className="text-sm">No tracking</span>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                row.original.status.toLowerCase() === 'delivered'
                  ? 'bg-green-100'
                  : 'bg-blue-100'
              }`}
            >
              <Truck
                className={`w-4 h-4 ${
                  row.original.status.toLowerCase() === 'delivered'
                    ? 'text-green-600'
                    : 'text-blue-600'
                }`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.onTrackShipment?.(tracking.tracking_number);
                    }}
                    className="text-sm font-medium text-gray-900 font-mono truncate hover:text-blue-600 transition-colors text-left group flex items-center gap-1"
                  >
                    {tracking.tracking_number}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to track shipment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="text-xs text-gray-500 font-medium">
              {tracking.courier}
            </span>
          </div>
        </div>
      );
    },
    size: 200,
  },

  // Total amount column with better formatting
  {
    accessorKey: 'total_amount',
    header: ({ column }) => (
      <div className="flex justify-center">
        <div
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 hover:bg-transparent font-semibold flex items-center cursor-pointer"
        >
          Amount
          <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
        </div>
      </div>
    ),
    cell: ({ row }) => {
      const amount = row.original.total_amount;
      const isHighValue = amount > 1000;

      return (
        <div className="text-center">
          <div
            className={`text-sm font-semibold ${isHighValue ? 'text-gray-900' : 'text-gray-700'}`}
          >
            RM{' '}
            {amount.toLocaleString('en-MY', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          {isHighValue && (
            <Badge
              variant="outline"
              className="text-xs mt-1 bg-amber-50 text-amber-700 border-amber-200"
            >
              High value
            </Badge>
          )}
        </div>
      );
    },
    size: 140,
  },

  // Actions column with enhanced menu
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const order = row.original;
      const hasTracking = !!order.order_tracking?.[0];

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel className="font-semibold">
                Order Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => actions.onViewDetails(order.id)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>

              {!hasTracking && (
                <DropdownMenuItem
                  onClick={() => actions.onCreateShipment(order.id)}
                  className="cursor-pointer"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Create shipment
                </DropdownMenuItem>
              )}

              {hasTracking && (
                <DropdownMenuItem
                  onClick={() =>
                    actions.onTrackShipment?.(
                      order.order_tracking![0].tracking_number
                    )
                  }
                  className="cursor-pointer"
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Track shipment
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => actions.onCopyOrderId(order.id)}
                className="cursor-pointer"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy order ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    size: 60,
  },
];
