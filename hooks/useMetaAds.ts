import useSWR from 'swr';
import { getMetaAdsReport, getMetaAdsSettings, getMetaCampaigns } from '@/lib/api/meta-ads';

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

export function useMetaAdsReport(from: string, to: string, account: string, enabled: boolean) {
  const { data, error, isLoading } = useSWR(
    enabled ? ['meta-ads-report', from, to, account] : null,
    () => getMetaAdsReport(from, to, account),
    { revalidateOnFocus: false, keepPreviousData: true }
  );
  return { report: data, error: error as Error | undefined, isLoading };
}
