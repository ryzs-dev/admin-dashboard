import {
  getParcelDailyAccountInfo,
  getParcelDailySettings,
  ParcelDailyAccount,
} from '@/lib/api/parcel-daily';
import useSWR from 'swr';

export function useParcelDailyAccount() {
  const { data, error, isLoading, mutate } = useSWR('parcel-daily', () =>
    getParcelDailyAccountInfo()
  );
  return {
    account: data?.data as ParcelDailyAccount | undefined,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

export function useParcelDailySettings() {
  const { data, error, isLoading, mutate } = useSWR('parcel-daily-settings', getParcelDailySettings, {
    revalidateOnFocus: false,
  });
  return { settings: data, isLoading, isError: !!error, refresh: mutate };
}
