export type IntegrationId = 'parcel-daily' | 'shopee' | 'lazada';

export type Integration = {
  id: IntegrationId;
  name: string;
  category: string;
  description: string;
  logo: string;
  href: string;
  portalUrl?: string;
};

export const INTEGRATIONS: Integration[] = [
  {
    id: 'parcel-daily',
    name: 'Parcel Daily',
    category: 'Shipping',
    description: 'Book couriers, compare live prices and pay for shipments from your credit balance.',
    logo: '/images/integrations/parcel-daily.png',
    href: '/integrations/parcel-daily',
    portalUrl: 'https://partner.parceldaily.com',
  },
  {
    id: 'shopee',
    name: 'Shopee',
    category: 'Marketplace',
    description: 'Orange rows in the order sheet come in as Shopee orders, synced every 15 minutes.',
    logo: '/images/integrations/shopee.png',
    href: '/integrations/shopee',
    portalUrl: 'https://seller.shopee.com.my',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    category: 'Marketplace',
    description: 'Dark-blue rows in the order sheet come in as Lazada orders, synced every 15 minutes.',
    logo: '/images/integrations/lazada.png',
    href: '/integrations/lazada',
    portalUrl: 'https://sellercenter.lazada.com.my',
  },
];

export function getIntegration(id: IntegrationId) {
  return INTEGRATIONS.find((integration) => integration.id === id)!;
}
