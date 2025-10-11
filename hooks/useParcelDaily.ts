import {
  createBulkParcelDailyShipments,
  createParcelDailyShipment,
  getParcelDailyAccountInfo,
  getParcelDailyOrderDetails,
} from '@/lib/api/parcel-daily';
import useSWR from 'swr';

export function useParcelDaily() {
  const { data, error, isLoading, mutate } = useSWR('parcel-daily', () =>
    getParcelDailyAccountInfo()
  );
  return {
    data: data?.data || [],
    isLoading,
    isError: error,
    refresh: mutate,
    createParcelDailyShipment,
    getParcelDailyOrderDetails,
    createBulkParcelDailyShipments,
  };
}
