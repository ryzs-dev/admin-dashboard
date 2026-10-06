'use client';

import Image from 'next/image';
import { useMarketplaces, useSheetSync } from '@/hooks/useMarketplaces';
import { useParcelDailyAccount } from '@/hooks/useParcelDaily';
import { cn } from '@/lib/utils';
import { Integration, IntegrationId } from './registry';

export type IntegrationStatus = 'connected' | 'attention' | 'disconnected' | 'error' | 'checking';

export function useIntegrationStatus(id: IntegrationId): IntegrationStatus {
  const parcelDaily = useParcelDailyAccount();
  const marketplaces = useMarketplaces();
  const sheetSync = useSheetSync();
  switch (id) {
    case 'parcel-daily':
      if (parcelDaily.isLoading) return 'checking';
      return parcelDaily.isError || !parcelDaily.account ? 'error' : 'connected';
    case 'shopee':
    case 'lazada': {
      if (marketplaces.isLoading || sheetSync.isLoading) return 'checking';
      const shops = marketplaces.status?.connections.filter((c) => c.platform === id) ?? [];
      if (sheetSync.sync?.lastError || shops.some((shop) => shop.lastSyncError)) return 'attention';
      if (shops.length || (sheetSync.sync?.counts[id] ?? 0) > 0) return 'connected';
      return sheetSync.isError && marketplaces.isError ? 'error' : 'disconnected';
    }
  }
}

const STATUS_STYLES: Record<IntegrationStatus, { label: string; className: string; dot: string }> = {
  connected: {
    label: 'Connected',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  attention: {
    label: 'Needs attention',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
  },
  disconnected: {
    label: 'Not connected',
    className: 'border-gray-200 bg-gray-50 text-gray-600',
    dot: 'bg-gray-400',
  },
  error: {
    label: 'Not connected',
    className: 'border-red-200 bg-red-50 text-red-700',
    dot: 'bg-red-500',
  },
  checking: {
    label: 'Checking…',
    className: 'border-gray-200 bg-gray-50 text-gray-500',
    dot: 'bg-gray-300 animate-pulse',
  },
};

export function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        style.className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {style.label}
    </span>
  );
}

export function IntegrationLogo({
  integration,
  size = 40,
  className,
}: {
  integration: Integration;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={integration.logo}
      alt={`${integration.name} logo`}
      width={size}
      height={size}
      className={cn('shrink-0 rounded-lg', className)}
    />
  );
}
