import { Button } from '@/components/ui/button';
import CustomerTable from './CustomerTable';
import { useCustomer } from '@/hooks/useCustomer';
import { FilterType } from './types';

export default function CustomerResults({
  limit,
  page,
  search,
  sortBy,
  sortOrder,
  filter,
  setPage,
  setSortBy,
  setSortOrder,
}: {
  limit: number;
  page: number;
  search: string;
  sortBy: 'name' | 'created_at';
  sortOrder: 'asc' | 'desc';
  filter: FilterType;
  setPage: (p: number) => void;
  setSortBy: (s: 'name' | 'created_at') => void;
  setSortOrder: (o: 'asc' | 'desc') => void;
}) {
  const { customers, pagination, isLoading, isError } = useCustomer({
    limit,
    offset: (page - 1) * limit,
    search,
    sortBy,
    sortOrder,
    filter,
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error!</p>;
  if (!customers?.length) return <p>No customers found</p>;

  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  return (
    <>
      <div className="max-h-[80vh] overflow-auto">
        <CustomerTable
          sortedCustomers={customers}
          search={search}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(field) => {
            if (sortBy === field) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy(field as 'name' | 'created_at');
              setSortOrder('asc');
            }
          }}
          onEdit={() => console.log('Edit customer')}
          onDelete={() => console.log('Delete customer')}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
