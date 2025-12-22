'use client';

import { Suspense } from 'react';
import { OrderTable } from '@/components/modules/order/OrderTable';
import { useOrders } from '@/hooks/useOrders';

function OrdersPageContent() {
  const { orders, isLoading } = useOrders();

  return (
    <div className="p-6">
      <OrderTable data={orders ?? []} isLoading={isLoading} />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading orders...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
}
