'use client';

import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderTable } from '@/components/modules/order/OrderTable';

const queryClient = new QueryClient();

export default function OrdersPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div className="p-6">Loading orders...</div>}>
        <OrderTable />
      </Suspense>
    </QueryClientProvider>
  );
}
