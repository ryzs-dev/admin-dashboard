'use client';

import { Suspense } from 'react';
import { MarketplaceIntegrationPage } from '@/components/modules/integrations/marketplace/MarketplaceIntegrationPage';

export default function ShopeeIntegrationPage() {
  return (
    <Suspense>
      <MarketplaceIntegrationPage platform="shopee" />
    </Suspense>
  );
}
