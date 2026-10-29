'use client';

import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderTable } from '@/components/modules/order/OrderTable';
import DistributorList from '@/components/modules/distributor/DistributorList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const queryClient = new QueryClient();

export default function DistributorsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Tabs defaultValue="orders" className="mt-4">
        <TabsList className="mx-4">
          <TabsTrigger value="orders">Distributor Orders</TabsTrigger>
          <TabsTrigger value="list">Distributor List</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <Suspense fallback={<div className="p-6">Loading orders...</div>}>
            <OrderTable orderType="distributor" />
          </Suspense>
        </TabsContent>
        <TabsContent value="list">
          <DistributorList
            onDistributorsChanged={() =>
              queryClient.invalidateQueries({ queryKey: ['orders'] })
            }
          />
        </TabsContent>
      </Tabs>
    </QueryClientProvider>
  );
}
