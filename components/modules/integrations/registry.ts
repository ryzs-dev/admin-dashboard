export type IntegrationId = 'parcel-daily';

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
];

export function getIntegration(id: IntegrationId) {
  return INTEGRATIONS.find((integration) => integration.id === id)!;
}
