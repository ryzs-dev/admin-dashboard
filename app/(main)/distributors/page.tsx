'use client';

import { Suspense, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderTable } from '@/components/modules/order/OrderTable';
import DistributorList from '@/components/modules/distributor/DistributorList';
import {
  DistributorTabs,
  DistributorView,
} from '@/components/modules/distributor/DistributorTabs';

const queryClient = new QueryClient();

export default function DistributorsPage() {
  const [view, setView] = useState<DistributorView>('orders');
  const tabs = <DistributorTabs value={view} onChange={setView} />;

  return (
    <QueryClientProvider client={queryClient}>
      {view === 'orders' ? (
        <Suspense fallback={<div className="p-6">Loading orders...</div>}>
          <OrderTable
            orderType="distributor"
            title="Distributors"
            description="Orders placed for distributor phone numbers."
            subNav={tabs}
          />
        </Suspense>
      ) : (
        <DistributorList
          subNav={tabs}
          onDistributorsChanged={() => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orders-summary'] });
          }}
        />
      )}
    </QueryClientProvider>
  );
}
