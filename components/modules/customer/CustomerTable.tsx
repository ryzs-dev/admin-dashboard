import { Customer } from './types';
import { ArrowUpDown } from 'lucide-react';
import { UUID } from 'crypto';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/currency';

type CustomerTableProps = {
  sortedCustomers: Customer[];
  search: string;
  sortBy: keyof Customer;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: keyof Customer) => void;
  onEdit: (customerId: UUID) => void;
  onDelete: (customerId: UUID) => void;
};

export default function CustomerTable({
  sortedCustomers,
  search,
  sortBy,
  onSortChange,
}: CustomerTableProps) {
  const router = useRouter();

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="overflow-auto max-h-[75vh]">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[200px]" />
            <col className="w-[150px]" />
            <col className="w-[200px]" />
            <col className="w-[80px]" />
            <col className="w-[150px]" />
            <col className="w-[150px]" />
            <col className="w-[150px]" />
          </colgroup>
          <thead className="bg-gray-50 border-b sticky top-0">
            <tr>
              <th
                className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => onSortChange('name')}
              >
                <div className="flex items-center gap-2">
                  <span>Name</span>
                  {sortBy === 'name' && <ArrowUpDown className="w-3 h-3" />}
                </div>
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                Phone
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                Email
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                Type
              </th>
              <th
                className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => onSortChange('total_amount_spent')}
              >
                <div className="flex items-center gap-2">
                  <span>Total Amount Spent</span>
                  {sortBy === 'total_amount_spent' && (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </div>
              </th>
              <th
                className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => onSortChange('total_purchase_count')}
              >
                <div className="flex items-center gap-2">
                  <span>Purchases Count</span>
                  {sortBy === 'total_purchase_count' && (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </div>
              </th>
              <th
                className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => onSortChange('last_order_date')}
              >
                <div className="flex items-center gap-2">
                  <span>Last Ordered</span>
                  {sortBy === 'last_order_date' && (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </div>
              </th>
              {/* <th
                className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => onSortChange('created_at')}
              >
                <div className="flex items-center gap-2">
                  <span>Created</span>
                  {sortBy === 'created_at' && (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </div>
              </th> */}
            </tr>
          </thead>
          <tbody className="divide-y overflow-y-auto">
            {sortedCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className="text-gray-400">
                    {search.trim() ? (
                      <>
                        <div className="w-12 h-12 mx-auto mb-3">
                          <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-medium">
                          No customers found
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Try adjusting your search terms
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 mx-auto mb-3">
                          <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-medium">
                          No customers found
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Add your first customer to get started
                        </p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedCustomers.map((c: Customer) => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 transition-colors"
                  onClick={(e) => {
                    if ((e.target as HTMLInputElement).type !== 'checkbox') {
                      router.push(`/customers/${c.id}`);
                    }
                  }}
                >
                  <td className="p-4">
                    <span className="text-sm font-medium text-gray-900 truncate block">
                      {c.name}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-600 truncate block">
                      {c.phone_number}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-600 truncate block">
                      {c.email || '—'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {c.repeat_customer}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-600 truncate block">
                      {formatCurrency(c.total_amount_spent)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-600 truncate block">
                      {c.total_purchase_count}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-600 truncate block">
                      {c.last_order_date
                        ? new Date(c.last_order_date).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )
                        : '—'}{' '}
                      {/* fallback for no date */}
                    </span>
                  </td>

                  {/* <td className="p-4">
                    <span className="text-sm text-gray-600">

                    </span>
                  </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
