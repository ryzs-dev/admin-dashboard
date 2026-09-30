import { Button } from '@/components/ui/button';
import CustomerTable from './CustomerTable';
import { useCustomerList } from '@/hooks/useCustomer';
import { CustomerSortField, CustomerTypeFilter, FilterType } from './types';

export default function CustomerResults({
  limit,
  page,
  search,
  sortBy,
  sortOrder,
  filter,
  type,
  setPage,
  onSortChange,
}: {
  limit: number;
  page: number;
  search: string;
  sortBy: CustomerSortField;
  sortOrder: 'asc' | 'desc';
  filter: FilterType;
  type: CustomerTypeFilter;
  setPage: (p: number) => void;
  onSortChange: (field: CustomerSortField) => void;
}) {
  const { customers, total, isLoading, isRefreshing, isError } =
    useCustomerList({
      limit,
      offset: (page - 1) * limit,
      search,
      sortBy,
      sortOrder,
      filter,
      type,
    });

  if (isError) {
    return (
      <p className="p-12 text-center text-sm text-red-600">
        Couldn&apos;t load customers. Refresh the page to try again.
      </p>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const firstRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRow = Math.min(page * limit, total);

  return (
    <>
      <CustomerTable
        customers={customers}
        search={search}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={onSortChange}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        pageSize={limit}
      />

      <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? 'Loading customers…'
            : `Showing ${firstRow.toLocaleString()}–${lastRow.toLocaleString()} of ${total.toLocaleString()}`}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}
