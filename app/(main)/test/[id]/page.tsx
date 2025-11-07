import OrderTemplate from '@/components/modules/order/OrderTemplate';
import { getOrderById } from '@/lib/api/order';
import { UUID } from 'crypto';

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: UUID }>;
}) {
  const { order } = await getOrderById((await params).id);

  return (
    <>
      <OrderTemplate order={order} />
    </>
  );
}
