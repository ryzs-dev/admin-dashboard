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
import { useState, useMemo } from 'react';
import { Order } from './types';
import {
  Search,
  Download,
  Filter,
  X,
  Package,
  AlertCircle,
} from 'lucide-react';
import { createColumns } from './OrderTableColumns';
import { toast } from 'sonner';

interface OrderTableProps {
  data: Order[];
  onBulkAction?: (selectedIds: string[]) => void;
  isLoading?: boolean;
}

export function OrderTable({ data, onBulkAction, isLoading }: OrderTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Action handlers
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
        onTrackShipment: (trackingNumber) => {
          console.log('Track shipment:', trackingNumber);
          // TODO: Open tracking modal or redirect to courier site
        },
      }),
    [router]
  );

  // Filter data by status
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return data;
    return data.filter(
      (order) => order.status.toLowerCase() === statusFilter.toLowerCase()
    );
  }, [data, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      rowSelection,
      globalFilter,
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-500 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-500 font-medium">Delivered</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.delivered}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                RM{' '}
                {stats.total.toLocaleString('en-MY', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders, customers..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 pr-9"
                />
                {globalFilter && (
                  <button
                    onClick={() => setGlobalFilter('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Export Button */}
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
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
                        onBulkAction?.(selectedIds);
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
                        <p className="text-xs mt-1 text-gray-500">
                          {globalFilter || statusFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Orders will appear here once created'}
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
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    First
                  </Button>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
