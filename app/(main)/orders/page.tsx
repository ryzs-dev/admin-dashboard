import { OrderTable } from '@/components/modules/order/OrderTable';
import { getAllOrders } from '@/lib/api/order';

export default async function OrdersPage() {
  const { orders } = await getAllOrders({ limit: 1000 });
  return (
    <div className="p-6">
      <OrderTable data={orders} />
    </div>
  );
}
