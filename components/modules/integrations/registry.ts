export type IntegrationId = 'parcel-daily' | 'shopee' | 'lazada' | 'converra' | 'meta-ads';

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
  {
    id: 'converra',
    name: 'Converra',
    category: 'WhatsApp marketing',
    description: 'Customers and segments sync to Converra for WhatsApp broadcasts and inbox.',
    logo: '/images/integrations/converra.png',
    href: '/integrations/converra',
    portalUrl: 'https://app.converra.app',
  },
  {
    id: 'meta-ads',
    name: 'Meta ads',
    category: 'Advertising',
    description: 'Ad spend and ROAS beside your sales, and WhatsApp orders sent back to Meta for each campaign.',
    logo: '/images/integrations/meta.png',
    href: '/integrations/meta-ads',
    portalUrl: 'https://adsmanager.facebook.com',
  },
];

export function getIntegration(id: IntegrationId) {
  return INTEGRATIONS.find((integration) => integration.id === id)!;
}
