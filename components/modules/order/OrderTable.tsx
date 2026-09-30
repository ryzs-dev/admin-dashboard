'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Plus, Search, Send, X } from 'lucide-react';
import { createColumns } from './OrderTableColumns';
import { toast } from 'sonner';
import { useMessage } from '@/hooks/useMessage';
import { DatePicker } from '../utils/ui/DatePicker';
import { formatDateToYYYYMMDD } from '@/lib/utils/date';
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import DeleteDialog from '../alert/DeleteDialog';
import { UUID } from 'crypto';
import { useOrders } from '@/hooks/useOrders';
import { Order } from './types';
import { cn } from '@/lib/utils';
import { createBulkOrder, getOrderSummary, OrderStatusGroup } from '@/lib/api/order';
import { COURIER_SERVICES } from '../parcel-daily/constants';
import OrderFormDialog from './OrderFormDialog';
import { useCustomer } from '@/hooks/useCustomer';
import { useProducts } from '@/hooks/useProducts';
import { OrderInput } from '@/types/order';

interface OrdersResponse {
  rows: Order[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

type StatusTab = 'all' | OrderStatusGroup;

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'needs_shipment', label: 'Needs shipment' },
  { value: 'awaiting_pickup', label: 'Awaiting pickup' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'problem', label: 'Problem' },
];

const PAGE_SIZES = [10, 20, 50, 100];

// Customer has no fixed width so it absorbs any extra space.
const COLUMN_WIDTHS: Record<string, string> = {
  select: 'w-14',
  created_at: 'w-[170px]',
  items: 'w-[170px]',
  status: 'w-[160px]',
  tracking: 'w-[210px]',
  total_amount: 'w-[120px]',
  actions: 'w-16',
};

export function OrderTable() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { fetchOrders, deleteOrder, createOrder } = useOrders();
  const { customers } = useCustomer({ limit: 500 });
  const { products } = useProducts();
  const { sendTrackingInfo } = useMessage();
  const searchParams = useSearchParams();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: Math.max(Number(searchParams.get('page') || 1) - 1, 0),
    pageSize: PAGE_SIZES.includes(Number(searchParams.get('pageSize')))
      ? Number(searchParams.get('pageSize'))
      : 20,
  }));
  const [status, setStatus] = useState<StatusTab>(
    () => (searchParams.get('status') as StatusTab) || 'all'
  );
  const [location, setLocation] = useState(
    () => searchParams.get('location') || 'all'
  );
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const [deleteTargetId, setDeleteTargetId] = useState<UUID | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isBulkShipping, setIsBulkShipping] = useState(false);
  const [bulkCourier, setBulkCourier] = useState('spx');
  const [bulkDeliveryType, setBulkDeliveryType] = useState<'pickup' | 'dropoff'>(
    'pickup'
  );

  useEffect(() => {
    const handler = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const isFirstFilterRun = useRef(true);
  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search, status, location, dateRange, sorting]);

  useEffect(() => {
    setRowSelection({});
  }, [pagination, search, status, location, dateRange, sorting]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', String(pagination.pageIndex + 1));
    params.set('pageSize', String(pagination.pageSize));
    if (status !== 'all') params.set('status', status);
    if (location !== 'all') params.set('location', location);
    router.replace(`/orders?${params.toString()}`, { scroll: false });
  }, [pagination, status, location, router]);

  const refreshOrders = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
      queryClient.invalidateQueries({ queryKey: ['orders-summary'] }),
    ]);
  }, [queryClient]);

  const { data: summary } = useQuery({
    queryKey: ['orders-summary'],
    queryFn: getOrderSummary,
    staleTime: 60_000,
  });

  const { data, isLoading, isFetching } = useQuery<OrdersResponse, Error>({
    queryKey: ['orders', pagination, sorting, status, location, search, dateRange],
    queryFn: () =>
      fetchOrders({
        pagination,
        sorting,
        filters: {
          search,
          status,
          location,
          dateFrom: dateRange.from ? new Date(dateRange.from) : undefined,
          dateTo: dateRange.to ? new Date(dateRange.to) : undefined,
        },
      }),
    keepPreviousData: true,
  } as UseQueryOptions<OrdersResponse, Error>);

  const handleCreateOrder = async (input: OrderInput) => {
    setIsCreating(true);
    try {
      const result = await createOrder(input);
      toast.success(
        result?.order?.order_number
          ? `Order ${result.order.order_number} created`
          : 'Order created successfully'
      );
      setIsCreateOpen(false);
      await refreshOrders();
      if (result?.order?.id) {
        router.push(`/orders/${result.order.id}`);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendTracking = useCallback(
    async (selectedIds: string[]) => {
      if (!selectedIds.length) {
        toast.error('No orders selected for tracking');
        return;
      }

      const payload: {
        orderTrackingId: string;
        name: string;
        phone: string;
        courier: string;
        tracking: string;
      }[] = [];

      for (const id of selectedIds) {
        const order = data?.rows.find((o) => o.id === id);
        if (!order) continue;

        const orderTrackingId = order.order_tracking?.id;
        const name = order.customers?.name || '';
        const phone = order.customers?.phone_number || '';
        const courier = order.order_tracking?.courier || '';
        const tracking = order.order_tracking?.tracking_number || '';

        const missingFields: string[] = [];
        if (!orderTrackingId) missingFields.push('order tracking ID');
        if (!phone) missingFields.push('phone');
        if (!tracking) missingFields.push('tracking');
        if (!courier) missingFields.push('courier');

        if (missingFields.length) {
          toast.error(
            `Order ${order.order_number} is missing: ${missingFields.join(', ')}`
          );
          return;
        }

        payload.push({ orderTrackingId: orderTrackingId!, name, phone, courier, tracking });
      }

      if (!payload.length) {
        toast.error('No valid tracking jobs to enqueue.');
        return;
      }

      try {
        await sendTrackingInfo(payload);
        toast.success(`${payload.length} tracking message(s) queued`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to enqueue tracking jobs');
      }
    },
    [data, sendTrackingInfo]
  );

  const onDeleteOrder = async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);
    try {
      await deleteOrder(deleteTargetId);
      toast.success('Order deleted');
      await refreshOrders();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete order');
    } finally {
      setIsDeleting(false);
      setOpen(false);
      setDeleteTargetId(null);
    }
  };

  const columns = useMemo(
    () =>
      createColumns({
        onViewDetails: (orderId) => router.push(`/orders/${orderId}`),
        onDeleteOrder: (orderId) => {
          setDeleteTargetId(orderId);
          setOpen(true);
        },
        onSendTracking: (orderId) => handleSendTracking([orderId]),
        onCopy: (value, label) => {
          navigator.clipboard.writeText(value);
          toast.success(`${label} copied`);
        },
      }),
    [router, handleSendTracking]
  );

  const total = data?.pagination?.total ?? 0;

  const table = useReactTable({
    data: data?.rows ?? [],
    columns,
    getRowId: (row) => row.id,
    state: { pagination, sorting, rowSelection },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  const handleCreateBulkShipments = async () => {
    const ids = selectedRows.map((r) => r.original.id);

    if (!ids.length) {
      toast.error('Select at least one order');
      return;
    }

    setIsBulkShipping(true);
    try {
      const result = await createBulkOrder(ids, {
        isDropoff: bulkDeliveryType === 'dropoff',
        serviceProvider: bulkCourier,
      });
      table.resetRowSelection();
      await refreshOrders();

      if (result.succeeded === result.results.length) {
        toast.success(result.message);
      } else if (result.succeeded > 0) {
        toast.success(result.message);
        const failed = result.results.filter((r) => !r.success);
        const preview = failed
          .slice(0, 3)
          .map((r) => r.error ?? 'Unknown error')
          .join('; ');
        toast.warning(
          failed.length > 3 ? `${preview} (+${failed.length - 3} more)` : preview
        );
      } else {
        toast.error(result.results[0]?.error ?? 'No shipments were created');
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsBulkShipping(false);
    }
  };

  const hasFilters =
    !!searchInput || !!dateRange.from || location !== 'all';
  const firstRow = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const lastRow = Math.min((pagination.pageIndex + 1) * pagination.pageSize, total);

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <OrderFormDialog
        isOpen={isCreateOpen}
        onClose={() => !isCreating && setIsCreateOpen(false)}
        onSubmit={handleCreateOrder}
        customers={customers ?? []}
        products={products ?? []}
        isSubmitting={isCreating}
      />

      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track every order from payment to delivery.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New order
          </Button>
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <div className="overflow-x-auto border-b">
            <div className="flex min-w-max gap-1 px-4 pt-3">
              {STATUS_TABS.map((tab) => {
                const isActive = status === tab.value;
                const count = summary?.[tab.value];

                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatus(tab.value)}
                    className={cn(
                      '-mb-px flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    )}
                  >
                    {tab.label}
                    {count !== undefined && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs tabular-nums',
                          isActive ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {count.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
            <div className="relative lg:w-96">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search order number, name, phone or email"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-10 pl-9"
              />
            </div>

            <DatePicker
              value={
                dateRange.from
                  ? {
                      from: new Date(dateRange.from),
                      to: dateRange.to ? new Date(dateRange.to) : undefined,
                    }
                  : undefined
              }
              onChange={(range) =>
                setDateRange({
                  from: formatDateToYYYYMMDD(range?.from),
                  to: formatDateToYYYYMMDD(range?.to ?? range?.from),
                })
              }
            />

            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="h-10 lg:w-[180px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                <SelectItem value="west">West Malaysia</SelectItem>
                <SelectItem value="east">East Malaysia</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground"
                onClick={() => {
                  setSearchInput('');
                  setDateRange({ from: '', to: '' });
                  setLocation('all');
                }}
              >
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            )}

            {isFetching && !isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground lg:ml-auto" />
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] table-fixed">
              <thead className="border-b bg-gray-50/80">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={cn(
                          'whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500',
                          COLUMN_WIDTHS[header.column.id],
                          header.column.id === 'select' && 'pl-6',
                          header.column.id === 'actions' && 'pr-6'
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody
                className={cn(
                  'divide-y transition-opacity',
                  isFetching && !isLoading && 'opacity-60'
                )}
              >
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-4 pl-6 pr-4">
                        <Skeleton className="h-4 w-4" />
                      </td>
                      {Array.from({ length: columns.length - 1 }).map((__, j) => (
                        <td key={j} className="px-4 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/orders/${row.original.id}`)}
                      className={cn(
                        'cursor-pointer transition-colors',
                        row.getIsSelected() ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={cn(
                            'px-4 py-4 align-middle',
                            cell.column.id === 'select' && 'pl-6',
                            cell.column.id === 'actions' && 'pr-6'
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-gray-900">No orders found</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Try a different status, date range or search.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                {isLoading
                  ? 'Loading orders…'
                  : `Showing ${firstRow.toLocaleString()}–${lastRow.toLocaleString()} of ${total.toLocaleString()}`}
              </span>
              <span className="hidden sm:inline">·</span>
              <div className="flex items-center gap-2">
                <span>Rows</span>
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(value) =>
                    setPagination({ pageIndex: 0, pageSize: Number(value) })
                  }
                >
                  <SelectTrigger className="h-8 w-[72px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Page {pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <DeleteDialog
        open={open}
        setOpen={setOpen}
        isLoading={isDeleting}
        onConfirm={onDeleteOrder}
        title="Delete order?"
        description="The order will be removed from the list and excluded from totals and analytics."
      />

      {hasSelection && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 z-50 -translate-x-1/2',
            'w-[calc(100%-2rem)] max-w-3xl',
            'rounded-xl border bg-white px-4 py-3 shadow-xl shadow-black/10',
            'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
            'animate-in fade-in slide-in-from-bottom-4 duration-200'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-blue-600 px-2 text-xs font-semibold tabular-nums text-white">
              {selectedRows.length}
            </span>
            <p className="text-sm font-medium text-gray-700">
              {selectedRows.length === 1 ? 'order' : 'orders'} selected
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={bulkCourier} onValueChange={setBulkCourier} disabled={isBulkShipping}>
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue placeholder="Courier" />
              </SelectTrigger>
              <SelectContent>
                {[...COURIER_SERVICES.Malaysia, ...COURIER_SERVICES.Singapore].map(
                  (courier) => (
                    <SelectItem key={courier.value} value={courier.value}>
                      {courier.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Select
              value={bulkDeliveryType}
              onValueChange={(value: 'pickup' | 'dropoff') => setBulkDeliveryType(value)}
              disabled={isBulkShipping}
            >
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">Pick up</SelectItem>
                <SelectItem value="dropoff">Drop-off</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-8"
              onClick={handleCreateBulkShipments}
              disabled={isBulkShipping}
            >
              {isBulkShipping ? 'Creating…' : 'Create shipments'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() => handleSendTracking(selectedRows.map((r) => r.original.id))}
            >
              <Send className="h-3.5 w-3.5" />
              Send tracking
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-muted-foreground"
              onClick={() => table.resetRowSelection()}
              disabled={isBulkShipping}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
