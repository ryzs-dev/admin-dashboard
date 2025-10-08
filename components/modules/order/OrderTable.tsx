import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Order } from './types';
import { DatePicker } from '../utils/ui/DatePicker';
import { DateRange } from 'react-day-picker';
import { UUID } from 'crypto';
import SendTrackingButton from '../utils/ui/SendTrackingButton';
import { OrderInput } from '@/types/order';

interface OrderTableProps {
  orders: Order[];
  pagination?: { limit: number; offset: number; total: number };
  bulkDeleteOrders: (ids: UUID[]) => Promise<void>;
  refresh: () => Promise<void>;
  updateOrder: (id: UUID, updates: Partial<OrderInput>) => Promise<void>;
}

export default function OrderTable({
  orders,
  bulkDeleteOrders,
  refresh,
  updateOrder,
}: OrderTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedOrders, setSelectedOrders] = useState<UUID[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteMessage, setBulkDeleteMessage] = useState('');

  const normalizeDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // local timezone
  };

  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(orders.map((order) => order.status))];
    return statuses.sort();
  }, [orders]);

  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(term) ||
          order.customers?.name?.toLowerCase().includes(term) ||
          order.customers?.email?.toLowerCase().includes(term) ||
          order.order_tracking?.[0]?.tracking_number
            ?.toLowerCase()
            .includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((order) => order.status === statusFilter);
    }

    if (dateRange?.from) {
      result = result.filter(
        (order) => normalizeDate(order.order_date) >= dateRange.from!
      );
    }

    if (dateRange?.to) {
      result = result.filter(
        (order) => normalizeDate(order.order_date) <= dateRange.to!
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return (
            new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
          );
        case 'date-asc':
          return (
            new Date(a.order_date).getTime() - new Date(b.order_date).getTime()
          );
        case 'total-desc':
          return b.total_amount - a.total_amount;
        case 'total-asc':
          return a.total_amount - b.total_amount;
        case 'customer':
          return (a.customers?.name || '').localeCompare(
            b.customers?.name || ''
          );
        default:
          return 0;
      }
    });

    return result;
  }, [orders, searchTerm, statusFilter, sortBy, dateRange]);

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;
    setIsBulkDeleting(true);
    setBulkDeleteMessage(
      `Deleting ${selectedOrders.length} order${selectedOrders.length > 1 ? 's' : ''}...`
    );
    try {
      await bulkDeleteOrders(selectedOrders);
      refresh();
      setSelectedOrders([]);
      setBulkDeleteMessage(
        `Successfully deleted ${selectedOrders.length} order${selectedOrders.length > 1 ? 's' : ''}`
      );

      setTimeout(() => setBulkDeleteMessage(''), 3000);
    } catch (error) {
      console.error('Failed to delete orders:', error);
      setBulkDeleteMessage('Failed to delete orders');
      setTimeout(() => setBulkDeleteMessage(''), 3000);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredAndSortedOrders.slice(startIndex, endIndex);

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm || statusFilter !== 'all' || dateRange?.from || dateRange?.to;

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange(undefined);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search - now more prominent */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters & Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DatePicker value={dateRange} onChange={setDateRange} />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest first</SelectItem>
                <SelectItem value="date-asc">Oldest first</SelectItem>
                <SelectItem value="total-desc">Highest amount</SelectItem>
                <SelectItem value="total-asc">Lowest amount</SelectItem>
                <SelectItem value="customer">Customer A-Z</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[50px]" />
              <col className="w-[120px]" />
              <col className="w-[200px]" />
              <col className="w-[180px]" />
              <col className="w-[140px]" />
              <col className="w-[120px]" />
            </colgroup>
            <thead className="bg-gray-50 border-b sticky top-0">
              <tr>
                <th className="p-4">
                  <Input
                    type="checkbox"
                    className="rounded-xl w-4 h-4 "
                    checked={
                      paginatedOrders.length > 0 &&
                      selectedOrders.length === paginatedOrders.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders(paginatedOrders.map((o) => o.id));
                      } else {
                        setSelectedOrders([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                  Order
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                  Customer
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                  Tracking
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                  Total
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="text-gray-400">
                      <p className="text-sm font-medium">No orders found</p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="text-xs text-blue-600 hover:underline mt-2"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={(e) => {
                      if ((e.target as HTMLInputElement).type !== 'checkbox') {
                        router.push(`/orders/${order.id}`);
                      }
                    }}
                  >
                    <td className="p-4">
                      <Input
                        type="checkbox"
                        className="rounded-xl w-4 h-4"
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setSelectedOrders([...selectedOrders, order.id]);
                          } else {
                            setSelectedOrders(
                              selectedOrders.filter((id) => id !== order.id)
                            );
                          }
                        }}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          #{startIndex + index + 1}
                        </span>
                        <span className="text-xs text-gray-500">
                          {normalizeDate(order.order_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {order.customers?.name || '-'}
                        </span>
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {order.customers?.email || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {order.order_tracking &&
                      order.order_tracking.length > 0 ? (
                        <div className="flex flex-row items-center gap-2">
                          <div>
                            {order.status.toLowerCase() === 'delivered' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex flex-col items-start ">
                            <span className="text-sm font-medium text-gray-900 font-mono truncate">
                              {order.order_tracking[0].tracking_number}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {order.order_tracking[0].courier}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-gray-900">
                        MYR {order.total_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end">
                      <SendTrackingButton
                        phone={order.customers?.phone_number}
                        orderId={order.id}
                        courier={order.order_tracking?.[0]?.courier || ''}
                        tracking_number={
                          order.order_tracking?.[0]?.tracking_number || ''
                        }
                        updateOrder={updateOrder}
                        refresh={refresh}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredAndSortedOrders.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredAndSortedOrders.length)} of{' '}
              {filteredAndSortedOrders.length}
            </div>

            {/* Bulk Actions Bar */}
            {selectedOrders.length > 0 && (
              <div
                className={`transition-all duration-300 ${
                  bulkDeleteMessage && !isBulkDeleting
                    ? 'p-2 bg-green-50 border border-green-200'
                    : 'p-2 bg-blue-50 border border-blue-200'
                } rounded-lg`}
              >
                <div className="flex items-center justify-between gap-10">
                  <div className="flex items-center gap-3">
                    {/* Selection Count with Animation */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center font-bold ">
                        {selectedOrders.length}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedOrders.length === 1 ? 'order' : 'orders'}{' '}
                        selected
                      </span>
                    </div>

                    {/* Status Message */}
                    {bulkDeleteMessage && (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        {isBulkDeleting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-medium text-blue-700">
                              {bulkDeleteMessage}
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-green-700">
                              {bulkDeleteMessage}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {!isBulkDeleting && bulkDeleteMessage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedOrders([]);
                          setBulkDeleteMessage('');
                        }}
                        className="text-green-700 hover:text-green-800 hover:bg-green-100"
                      >
                        Done
                      </Button>
                    )}
                    {!bulkDeleteMessage && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOrders([])}
                          disabled={isBulkDeleting}
                          className="hover:bg-gray-100 text-gray-700 hover:text-gray-800"
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleBulkDelete}
                          disabled={isBulkDeleting}
                          className="hover:bg-red-100 text-red-700 hover:text-red-800"
                        >
                          {isBulkDeleting ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-sm text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
