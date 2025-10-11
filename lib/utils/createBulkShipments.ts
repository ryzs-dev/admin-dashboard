import { Order } from '@/components/modules/order/types';
import { ShipmentInput } from '@/components/modules/parcel-daily/types';

export function createBulkShipments(order: Order): ShipmentInput {
  console.log('Creating shipment for order:', order);
  return {
    serviceProvider: 'spx', // default for now
    clientAddress: {
      fullName: order.customers?.name || '',
      countryCode: order.customers?.phone_number?.startsWith('+65')
        ? '+65'
        : '+60',
      phone: order.customers?.phone_number || '',
      email: order.customers?.email || 'test@gmail.com',
      line1: order.addresses?.full_address || '',
      line2: '',
      city: order.addresses?.city || '',
      postcode: order.addresses?.postcode || '',
      state: order.addresses?.state || '',
      country:
        order.addresses?.country === 'Singapore' ? 'Singapore' : 'Malaysia',
    },
    kg: 0.5,
    price: 0,
    cod: undefined, // optional: later allow toggling COD
    content: 'Feminine Products',
    content_value: order.total_amount || 0,
    isDropoff: false,
  };
}
