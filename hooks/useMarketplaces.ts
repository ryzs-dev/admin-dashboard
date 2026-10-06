import useSWR from 'swr';
import { getMarketplaceOrders, getMarketplaces, Marketplace } from '@/lib/api/marketplaces';

export function useMarketplaces() {
  const { data, error, isLoading, mutate } = useSWR('marketplaces', getMarketplaces);
  return { status: data, isLoading, isError: !!error, refresh: mutate };
}

export function useMarketplaceOrders(platform: Marketplace, page: number, pageSize = 20) {
  const { data, error, isLoading, mutate } = useSWR(
    ['marketplace-orders', platform, page, pageSize],
    () => getMarketplaceOrders(platform, { limit: pageSize, offset: page * pageSize })
  );
  return {
    orders: data?.orders ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
