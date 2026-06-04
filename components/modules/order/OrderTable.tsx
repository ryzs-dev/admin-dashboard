'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Filter,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Send,
} from 'lucide-react';
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
import { createBulkOrder } from '@/lib/api/order';
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

export function OrderTable() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { fetchOrders, deleteOrder, createOrder } = useOrders();
  const { customers } = useCustomer({ limit: 500 });
  const { products } = useProducts();
  const { sendTrackingInfo } = useMessage();
  const searchParams = useSearchParams();

  const pageFromUrl = searchParams.get('page');
  const pageSizeFromUrl = searchParams.get('pageSize');

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: pageFromUrl ? Number(pageFromUrl) - 1 : 0,
    pageSize: pageSizeFromUrl ? Number(pageSizeFromUrl) : 10,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    tracking: 'all',
    location: 'all',
  });
  const [localFilters, setLocalFilters] = useState({ ...filters });

  const [deleteTargetId, setDeleteTargetId] = useState<UUID | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isBulkShipping, setIsBulkShipping] = useState(false);

  const handleCreateOrder = async (data: OrderInput) => {
    setIsCreating(true);
    try {
      const result = await createOrder(data);
      toast.success(
        result?.order?.order_number
          ? `Order ${result.order.order_number} created`
          : 'Order created successfully'
      );
      setIsCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (result?.order?.id) {
        router.push(`/orders/${result.order.id}`);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to create order';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const { data, isFetching } = useQuery<OrdersResponse, Error>({
    queryKey: ['orders', pagination, sorting, JSON.stringify(filters)],
    queryFn: () =>
      fetchOrders({
        pagination,
        sorting,
        filters: {
          search: filters.search,
          status: filters.status,
          tracking: filters.tracking,
          location: filters.location,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        },
      }),
    keepPreviousData: true,
  } as UseQueryOptions<OrdersResponse, Error>);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', (pagination.pageIndex + 1).toString());
    params.set('pageSize', pagination.pageSize.toString());

    if (filters.location && filters.location !== 'all') {
      params.set('location', filters.location);
    } else {
      params.delete('location');
    }

    if (filters.tracking && filters.tracking !== 'all') {
      params.set('tracking', filters.tracking);
    } else {
      params.delete('tracking');
    }

    router.replace(`/orders?${params.toString()}`);
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    filters,
    router,
    searchParams,
  ]);

  useEffect(() => {
    const location = searchParams.get('location') || 'all';
    const tracking = searchParams.get('tracking') || 'all';

    setFilters((prev) => ({
      ...prev,
      location,
      tracking,
    }));

    setLocalFilters((prev) => ({
      ...prev,
      location,
      tracking,
    }));
  }, [searchParams]);

  const handleSendTracking = useCallback(
    async (selectedIds: string[]) => {
      if (!selectedIds.length) {
        toast.error('No orders selected for tracking');
        return;
      }

      const payload: any[] = [];

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

        payload.push({ orderTrackingId, name, phone, courier, tracking });
      }

      if (!payload.length) {
        toast.error('No valid tracking jobs to enqueue.');
        return;
      }

      try {
        await sendTrackingInfo(payload);
        toast.success(`📦 ${payload.length} tracking job(s) queued`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to enqueue tracking jobs');
      }
    },
    [data, sendTrackingInfo]
  );

  const handleCreateBulkShipments = async () => {
    const ids = selectedRows.map((r) => r.original.id);

    if (!ids.length) {
      toast.error('Select at least one order');
      return;
    }

    setIsBulkShipping(true);
    try {
      const result = await createBulkOrder(ids);
      table.resetRowSelection();
      await queryClient.invalidateQueries({ queryKey: ['orders'] });

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
          failed.length > 3
            ? `${preview} (+${failed.length - 3} more)`
            : preview
        );
      } else {
        const firstError =
          result.results[0]?.error ?? 'No shipments were created';
        toast.error(firstError);
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    } finally {
      setIsBulkShipping(false);
    }
  };

  // Delete order
  const onDeleteOrder = async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);
    try {
      await deleteOrder(deleteTargetId);
      toast.success('Order deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete order');
    } finally {
      setIsDeleting(false);
      setOpen(false);
      setDeleteTargetId(null);
    }
  };

  // Table columns
  const columns = useMemo(
    () =>
      createColumns({
        onViewDetails: (orderId) => router.push(`/orders/${orderId}`),
        onDeleteOrder: (orderId) => {
          setDeleteTargetId(orderId);
          setOpen(true);
        },
        onTrackShipment: (id) => handleSendTracking([id]),
        onCreateShipment: (orderId: string) => {
          console.log('Create shipment for', orderId);
        },
        onCopyOrderId: (orderId: string) => {
          navigator.clipboard.writeText(orderId);
          toast.success('Order ID copied to clipboard');
        },
      }),
    [router, handleSendTracking]
  );

  // React Table
  const table = useReactTable({
    data: data?.rows ?? [],
    columns,
    state: { pagination, sorting, rowSelection },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    pageCount: data?.pagination?.total
      ? Math.ceil(data.pagination.total / pagination.pageSize)
      : 0,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  return (
    <div className="m-4">
      <OrderFormDialog
        isOpen={isCreateOpen}
        onClose={() => !isCreating && setIsCreateOpen(false)}
        onSubmit={handleCreateOrder}
        customers={customers ?? []}
        products={products ?? []}
        isSubmitting={isCreating}
      />

      <Card>
        <CardHeader className="space-y-6">
          {/* Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-700">Filters</h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
                {(localFilters.search ||
                  localFilters.dateFrom ||
                  localFilters.dateTo ||
                  localFilters.status !== 'all' ||
                  localFilters.tracking !== 'all') && (
                  <button
                    onClick={() => {
                      setLocalFilters({
                        search: '',
                        dateFrom: '',
                        dateTo: '',
                        status: 'all',
                        tracking: 'all',
                        location: 'all',
                      });
                      setFilters({
                        search: '',
                        dateFrom: '',
                        dateTo: '',
                        status: 'all',
                        tracking: 'all',
                        location: 'all',
                      });
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <div className="max-w-4xl w-full flex gap-3">
                <div className="w-full flex-3">
                  <Input
                    placeholder="Search by order ID, customer, or product..."
                    value={localFilters.search}
                    onChange={(e) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                </div>

                <div className="flex-1">
                  <DatePicker
                    value={
                      localFilters.dateFrom || localFilters.dateTo
                        ? {
                            from: localFilters.dateFrom
                              ? new Date(localFilters.dateFrom)
                              : undefined,
                            to: localFilters.dateTo
                              ? new Date(localFilters.dateTo)
                              : undefined,
                          }
                        : undefined
                    }
                    onChange={(range) => {
                      const from = formatDateToYYYYMMDD(range?.from);
                      const to = range?.to
                        ? formatDateToYYYYMMDD(range?.to)
                        : formatDateToYYYYMMDD(range?.from);

                      setLocalFilters((prev) => ({
                        ...prev,
                        dateFrom: from,
                        dateTo: to,
                      }));
                    }}
                  />
                </div>

                <div className="flex-1">
                  <Select
                    value={localFilters.status}
                    onValueChange={(value) =>
                      setLocalFilters((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <Filter className="h-4 w-4 text-gray-500 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Transit">In Transit</SelectItem>
                      <SelectItem value="Delivering">Delivering</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select
                    value={localFilters.tracking}
                    onValueChange={(value) =>
                      setLocalFilters((prev) => ({ ...prev, tracking: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tracking" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="with">With Tracking</SelectItem>
                      <SelectItem value="without">No Tracking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select
                    value={localFilters.location}
                    onValueChange={(value) =>
                      setLocalFilters((prev) => ({ ...prev, location: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Location</SelectItem>
                      <SelectItem value="east">East Malaysia</SelectItem>
                      <SelectItem value="west">West Malaysia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="justify-end flex">
                <Button
                  size="sm"
                  onClick={() => {
                    setFilters({ ...localFilters });
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                  className="min-w-[120px]"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue>
                    {table.getState().pagination.pageSize}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
              {isFetching && (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin ml-2" />
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                size="sm"
                variant="outline"
                className="px-3"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Page</span>
                <span className="text-sm font-semibold text-gray-900">
                  {table.getState().pagination.pageIndex + 1}
                </span>
                <span className="text-sm text-gray-400">/</span>
                <span className="text-sm text-gray-600">
                  {table.getPageCount()}
                </span>
              </div>

              <Button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                size="sm"
                variant="outline"
                className="px-3"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Table */}
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'transition-colors duration-200', // smooth color changes
                      row.getIsSelected()
                        ? 'bg-indigo-50' // subtle background when selected
                        : 'hover:bg-gray-50' // hover effect when not selected
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-40 text-center"
                  >
                    <p>No orders found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DeleteDialog
        open={open}
        setOpen={setOpen}
        isLoading={isDeleting}
        onConfirm={onDeleteOrder}
        title="Delete order?"
        description="This action cannot be undone. The order will be permanently removed."
      />

      {hasSelection && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
            'w-[90%] max-w-lg',
            'bg-indigo-100 border border-gray-200 rounded-2xl',
            'px-4 py-3 shadow-xl shadow-black/10',
            'flex items-center justify-between gap-4',
            'animate-in slide-in-from-bottom-4 fade-in duration-200'
          )}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center h-7 px-2.5 bg-indigo-600 text-white text-xs font-bold rounded-lg tabular-nums">
              {selectedRows.length}
            </span>
            <p className="text-sm font-medium text-gray-700">
              {selectedRows.length === 1 ? 'order' : 'orders'} selected
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-8 px-3 text-xs font-semibold"
              onClick={() =>
                handleSendTracking(selectedRows.map((r) => r.original.id))
              }
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Send Tracking
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-8 px-3 text-xs font-semibold"
              onClick={handleCreateBulkShipments}
              disabled={isBulkShipping}
            >
              {isBulkShipping ? 'Creating…' : 'Create Bulk Shipments'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600 h-8 px-2 text-xs"
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
