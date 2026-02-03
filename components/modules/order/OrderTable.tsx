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
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
  RowSelectionState,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import { Order } from './types';
import { Filter, Package, AlertCircle } from 'lucide-react';
import { createColumns } from './OrderTableColumns';
import { toast } from 'sonner';
import { useMessage } from '@/hooks/useMessage';
import { DatePicker } from '../utils/ui/DatePicker';
import { formatDateToYYYYMMDD } from '@/lib/utils/date';
import { useOrders } from '@/hooks/useOrders';
import DeleteDialog from '../alert/DeleteDialog';
import { UUID } from 'crypto';

interface OrderTableProps {
  data: Order[];
  onBulkAction?: (selectedIds: string[]) => void;
  isLoading?: boolean;
}

export function OrderTable({ data, isLoading }: OrderTableProps) {
  const router = useRouter();
  const { deleteOrder, refresh } = useOrders();
  const { sendTrackingInfo } = useMessage();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
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

  console.log(data);

  // Action handlers

  const handleSendTracking = useCallback(
    async (selectedIds: string[]) => {
      if (!selectedIds || selectedIds.length === 0) {
        toast.error('No orders selected for tracking');
        return;
      }

      const payload: any[] = [];

      for (const id of selectedIds) {
        const order = data.find((o) => o.id === id);
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

        if (missingFields.length > 0) {
          toast.error(
            `Order ${order.order_number} is missing: ${missingFields.join(', ')}`
          );
          return;
        }

        payload.push({
          orderTrackingId,
          name,
          phone,
          courier,
          tracking,
        });
      }

      if (payload.length === 0) {
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

  const onDeleteOrder = async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);
    try {
      await deleteOrder(deleteTargetId);
      toast.success('Order deleted');
      refresh();
    } catch (error) {
      console.error(error);
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
        onCreateShipment: (orderId) => {
          console.log('Create shipment for:', orderId);
          // TODO: Implement shipment creation
        },
        onCopyOrderId: (orderId) => {
          navigator.clipboard.writeText(orderId);
          toast.success('Order ID copied to clipboard');
        },
        sendTrackingNumber: (trackingNumber) => {
          console.log('Send tracking number:', trackingNumber);
        },
        onTrackShipment: (id) => {
          console.log('Track shipment for :', id);
          handleSendTracking([id]);
        },
        onDeleteOrder: async (orderId) => {
          setDeleteTargetId(orderId);
          setOpen(true);
        },
      }),
    [router, handleSendTracking]
  );

  // Filter data by status
  const filteredData = useMemo(() => {
    return data.filter((order) => {
      const orderDate = new Date(order.created_at);

      // Global search
      const search = filters.search.toLowerCase();
      const matchesSearch =
        order.order_number.toLowerCase().includes(search) ||
        order.customers?.name.toLowerCase().includes(search);

      // Status filter
      const statusMatch =
        filters.status === 'all' ||
        order.order_tracking?.[0]?.message_status.toLowerCase() ===
          filters.status.toLowerCase();

      // Date range filter
      const fromMatch =
        !filters.dateFrom || orderDate >= new Date(filters.dateFrom);
      const toMatch = !filters.dateTo || orderDate <= new Date(filters.dateTo);

      return matchesSearch && statusMatch && fromMatch && toMatch;
    });
  }, [data, filters]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredData.reduce(
      (sum, order) => sum + order.total_amount,
      0
    );
    const delivered = filteredData.filter(
      (o) => o.status.toLowerCase() === 'delivered'
    ).length;
    return { total, delivered, count: filteredData.length };
  }, [filteredData]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-20">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <Package className="h-12 w-12 animate-pulse mb-4" />
            <p className="text-sm font-medium">Loading orders...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search orders..."
                value={localFilters.search}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
              />

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
                  setLocalFilters((prev) => ({
                    ...prev,
                    dateFrom: formatDateToYYYYMMDD(range?.from),
                    dateTo: formatDateToYYYYMMDD(range?.to),
                  }));
                }}
              />

              <Select
                value={localFilters.status}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="flex w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams();

                  if (localFilters.search)
                    params.set('search', localFilters.search);
                  if (localFilters.status && localFilters.status !== 'all')
                    params.set('status', localFilters.status);
                  if (localFilters.dateFrom)
                    params.set('dateFrom', localFilters.dateFrom);
                  if (localFilters.dateTo)
                    params.set('dateTo', localFilters.dateTo);

                  router.push(`?${params.toString()}`, { scroll: false });
                  setFilters({ ...localFilters }); // optional for client-side filtering
                }}
              >
                Apply
              </Button>
            </div>

            {/* Bulk Selection Bar */}
            {hasSelection && (
              <div className="flex px-6">
                <div className="flex items-center justify-between p-3 gap-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {selectedRows.length} order
                      {selectedRows.length > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const selectedIds = selectedRows.map(
                          (row) => row.original.id
                        );
                        handleSendTracking(selectedIds);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Bulk Action
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => table.resetRowSelection()}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-transparent bg-gray-50"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="whitespace-nowrap font-semibold text-gray-700"
                        style={{ width: header.column.columnDef.size }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="py-4"
                          onClick={(e) => {
                            // Prevent row click when clicking on interactive elements
                            if (
                              (e.target as HTMLElement).closest(
                                'button, a, [role="button"]'
                              )
                            ) {
                              e.stopPropagation();
                            }
                          }}
                        >
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
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Package className="h-12 w-12 mb-3 text-gray-300" />
                        <p className="text-sm font-medium text-gray-900">
                          No orders found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Enhanced Pagination */}
          {table.getRowModel().rows?.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing{' '}
                <span className="font-medium text-gray-900">
                  {table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    1}
                </span>{' '}
                -{' '}
                <span className="font-medium text-gray-900">
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                    filteredData.length
                  )}
                </span>{' '}
                of{' '}
                <span className="font-medium text-gray-900">
                  {filteredData.length}
                </span>{' '}
                orders
              </div>

              <div className="flex items-center gap-6">
                {/* Page size selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rows per page:</span>
                  <Select
                    value={table.getState().pagination.pageSize.toString()}
                    onValueChange={(value) => table.setPageSize(Number(value))}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Page navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1 px-2">
                    <span className="text-sm font-medium text-gray-900">
                      {table.getState().pagination.pageIndex + 1}
                    </span>
                    <span className="text-sm text-gray-600">of</span>
                    <span className="text-sm font-medium text-gray-900">
                      {table.getPageCount()}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
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
