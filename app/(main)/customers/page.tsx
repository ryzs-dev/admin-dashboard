'use client';

import CustomerResults from '@/components/modules/customer/CustomerResults';
import {
  CustomerSortField,
  CustomerTypeFilter,
  FilterType,
} from '@/components/modules/customer/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomerSummary } from '@/hooks/useCustomer';
import { cn } from '@/lib/utils';
import { Repeat, Search, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

const LIMIT = 25;

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  value?: number;
  hint?: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card
        className={cn(
          'gap-0 py-0 transition-colors hover:border-gray-300',
          active && 'border-blue-500 ring-1 ring-blue-500 hover:border-blue-500'
        )}
      >
        <CardContent className="flex items-start justify-between gap-4 p-5">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold">
              {value === undefined ? '—' : value.toLocaleString()}
            </p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className="rounded-lg bg-gray-100 p-2">
            <Icon className="h-5 w-5 text-gray-600" />
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [sortBy, setSortBy] = useState<CustomerSortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [customerType, setCustomerType] = useState<CustomerTypeFilter>('all');

  const { summary } = useCustomerSummary();

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeFilter, customerType, sortBy, sortOrder]);

  const selectType = (type: CustomerTypeFilter) => {
    setCustomerType(type);
    if (type === 'returning') {
      setSortBy('total_purchase_count');
      setSortOrder('desc');
    }
  };

  const returningShare =
    summary && summary.total > 0
      ? `${((summary.returning / summary.total) * 100).toFixed(1)}% of customers`
      : undefined;

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            See who buys again and how many times they have ordered.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            label="All customers"
            value={summary?.total}
            icon={Users}
            active={customerType === 'all'}
            onClick={() => selectType('all')}
          />
          <SummaryCard
            label="Returning customers"
            value={summary?.returning}
            hint={returningShare ? `2+ orders · ${returningShare}` : '2+ orders'}
            icon={Repeat}
            active={customerType === 'returning'}
            onClick={() => selectType('returning')}
          />
          <SummaryCard
            label="New customers"
            value={summary?.new}
            hint="1 order so far"
            icon={UserPlus}
            active={customerType === 'new'}
            onClick={() => selectType('new')}
          />
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              value={customerType}
              onValueChange={(value) => selectType(value as CustomerTypeFilter)}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="returning">Returning</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, phone or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>

              <Select
                value={activeFilter}
                onValueChange={(value) => setActiveFilter(value as FilterType)}
              >
                <SelectTrigger className="h-10 sm:w-[180px]">
                  <SelectValue placeholder="Last purchase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any time</SelectItem>
                  <SelectItem value="today">Bought today</SelectItem>
                  <SelectItem value="week">Bought this week</SelectItem>
                  <SelectItem value="month">Bought this month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <CustomerResults
            limit={LIMIT}
            page={page}
            search={debouncedSearch}
            sortBy={sortBy}
            sortOrder={sortOrder}
            filter={activeFilter}
            type={customerType}
            setPage={setPage}
            onSortChange={(field) => {
              if (sortBy === field) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(field);
                setSortOrder(field === 'name' ? 'asc' : 'desc');
              }
            }}
          />
        </Card>
      </div>
    </div>
  );
}
