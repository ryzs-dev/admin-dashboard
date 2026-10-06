import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/marketplaces`,
  headers: { 'Content-Type': 'application/json' },
});

export type Marketplace = 'shopee' | 'lazada';

export type MarketplaceConnection = {
  platform: Marketplace;
  shopId: string;
  shopName: string | null;
  region: string | null;
  connectedAt: string;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  expiresAt: string | null;
};

export type MarketplacesStatus = {
  platforms: Record<Marketplace, { configured: boolean; environment: string }>;
  setupRequired: boolean;
  connections: MarketplaceConnection[];
};

export type MarketplaceOrder = {
  id: string;
  platform: Marketplace;
  shop_id: string;
  external_id: string;
  order_number: string;
  status: string;
  buyer_name: string | null;
  total_amount: number;
  currency: string;
  items: { name: string; sku: string | null; variation: string | null; quantity: number; price: number }[];
  ordered_at: string;
  synced_at: string;
};

export async function getMarketplaces() {
  const { data } = await api.get<MarketplacesStatus>('/');
  return data;
}

export async function syncMarketplaceShop(platform: Marketplace, shopId: string) {
  const { data } = await api.post<{ orders: number }>(`/${platform}/${shopId}/sync`);
  return data;
}

export async function disconnectMarketplaceShop(platform: Marketplace, shopId: string) {
  await api.delete(`/${platform}/${shopId}`);
}

export async function getMarketplaceOrders(
  platform: Marketplace,
  options: { limit: number; offset: number }
) {
  const { data } = await api.get<{ orders: MarketplaceOrder[]; total: number }>(
    `/${platform}/orders`,
    { params: options }
  );
  return data;
}

// Full-page redirect: the marketplace sign-in sends the merchant back to this origin.
export function marketplaceConnectUrl(platform: Marketplace) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${API_BASE_URL}/api/marketplaces/${platform}/connect?return=${encodeURIComponent(origin)}`;
}

export type SheetSyncStatus = {
  running: boolean;
  tabs: string[];
  counts: Record<Marketplace, number>;
  lastResult: {
    tabs: string[];
    created: number;
    updated: number;
    removed: number;
    skipped: number;
    finishedAt: string;
  } | null;
  lastError: { message: string; at: string } | null;
};

export async function getSheetSync() {
  const { data } = await api.get<SheetSyncStatus>('/sheet-sync');
  return data;
}

export async function runSheetSync() {
  const { data } = await api.post<NonNullable<SheetSyncStatus['lastResult']>>('/sheet-sync');
  return data;
}
