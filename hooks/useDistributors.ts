import {
  createDistributor,
  deleteDistributor,
  getDistributors,
} from '@/lib/api/distributor';
import useSWR from 'swr';

export function useDistributors() {
  const { data, error, isLoading, mutate } = useSWR(
    'distributors',
    getDistributors
  );

  return {
    distributors: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
    createDistributor,
    deleteDistributor,
  };
}
