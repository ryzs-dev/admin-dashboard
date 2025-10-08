'use client';

import CustomerResults from '@/components/modules/customer/CustomerResults';
import { FilterType } from '@/components/modules/customer/types';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CustomersPage() {
  const limit = 25;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  return (
    <div className="max-h-screen bg-gray-50 flex">
      <div className="w-full mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Customers</h1>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex gap-3">
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md h-10"
          />

          <Select
            value={activeFilter}
            onValueChange={(value) => setActiveFilter(value as FilterType)}
          >
            <SelectTrigger className="w-[200px] h-10">
              <SelectValue placeholder="Filter customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="today">Purchased Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data section */}
        <div className="pb-6">
          <CustomerResults
            limit={limit}
            page={page}
            search={debouncedSearch}
            setSortBy={setSortBy}
            sortBy={sortBy}
            sortOrder={sortOrder}
            filter={activeFilter}
            setPage={setPage}
            setSortOrder={setSortOrder}
          />
        </div>
      </div>
    </div>
  );
}
