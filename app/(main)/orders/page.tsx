'use client';

import { OrderTable } from '@/components/modules/order/OrderTable';
import { useOrders } from '@/hooks/useOrders';

export default function OrdersPage() {
  const { orders, isLoading } = useOrders();

  return (
    <div className="p-6">
      <OrderTable data={orders ?? []} isLoading={isLoading} />
    </div>
  );
}
