'use client';

import { Suspense } from 'react';
import { MarketplaceIntegrationPage } from '@/components/modules/integrations/marketplace/MarketplaceIntegrationPage';

export default function LazadaIntegrationPage() {
  return (
    <Suspense>
      <MarketplaceIntegrationPage platform="lazada" />
    </Suspense>
  );
}
