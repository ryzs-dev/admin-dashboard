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
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { createColumns } from './OrderTableColumns';
import { toast } from 'sonner';
import { useMessage } from '@/hooks/useMessage';
import { DatePicker } from '../utils/ui/DatePicker';
import { formatDateToYYYYMMDD } from '@/lib/utils/date';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import DeleteDialog from '../alert/DeleteDialog';
import { UUID } from 'crypto';
import { useOrders } from '@/hooks/useOrders';
import { Order } from './types';
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
  const { fetchOrders, deleteOrder } = useOrders();
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
  });
  const [localFilters, setLocalFilters] = useState({ ...filters });

  const [deleteTargetId, setDeleteTargetId] = useState<UUID | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const { data, isFetching } = useQuery<OrdersResponse, Error>({
    queryKey: ['orders', pagination, sorting, filters],
    queryFn: () =>
      fetchOrders({
        pagination,
        sorting,
        filters: {
          search: filters.search,
          status: filters.status,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        },
      }),
    keepPreviousData: true,
  } as UseQueryOptions<OrdersResponse, Error>);

  console.log('Data', data);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', (pagination.pageIndex + 1).toString());
    params.set('pageSize', pagination.pageSize.toString());

    router.replace(`/orders?${params.toString()}`);
  }, [pagination.pageIndex, pagination.pageSize, router, searchParams]);

  // Bulk send tracking
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

        const orderTrackingId = order.order_tracking?.[0]?.id;
        const name = order.customers?.name || '';
        const phone = order.customers?.phone_number || '';
        const courier = order.order_tracking?.[0]?.courier || '';
        const tracking = order.order_tracking?.[0]?.tracking_number || '';

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
    <div>
      {/* Filters */}
      <Card>
        <CardHeader className="space-y-6">
          {/* Bulk Actions - Show first when active for better visibility */}
          {hasSelection && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedRows.length}{' '}
                      {selectedRows.length === 1 ? 'order' : 'orders'} selected
                    </p>
                    <p className="text-xs text-gray-600">
                      Ready for bulk action
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                    onClick={() =>
                      handleSendTracking(selectedRows.map((r) => r.original.id))
                    }
                  >
                    Send Tracking
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.resetRowSelection()}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
              {(localFilters.search ||
                localFilters.dateFrom ||
                localFilters.dateTo ||
                localFilters.status !== 'all') && (
                <button
                  onClick={() => {
                    setLocalFilters({
                      search: '',
                      dateFrom: '',
                      dateTo: '',
                      status: 'all',
                    });
                    setFilters({
                      search: '',
                      dateFrom: '',
                      dateTo: '',
                      status: 'all',
                    });
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              )}
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
                    onChange={(range) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        dateFrom: formatDateToYYYYMMDD(range?.from),
                        dateTo: formatDateToYYYYMMDD(range?.to),
                      }))
                    }
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
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
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

        <CardContent>
          {/* Table */}
          <div className="overflow-x-auto">
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
                    <TableRow key={row.id}>
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
          </div>

          {/* Pagination */}
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
    </div>
  );
}
