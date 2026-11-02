import useSWR from 'swr';
import { getMetaAdsSettings, getMetaCampaigns } from '@/lib/api/meta-ads';

export function useMetaAdsSettings() {
  const { data, isLoading, mutate } = useSWR('meta-ads-settings', getMetaAdsSettings, {
    revalidateOnFocus: false,
  });
  return { settings: data, isLoading, mutate };
}

export function useMetaCampaigns(month: string, enabled: boolean) {
  const { data, isLoading } = useSWR(
    enabled ? ['meta-campaigns', month] : null,
    () => getMetaCampaigns(month),
    { revalidateOnFocus: false }
  );
  return { campaigns: data ?? [], isLoading };
}
