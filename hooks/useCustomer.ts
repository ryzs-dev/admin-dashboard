import { Query } from '@/components/modules/customer/types';
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  getCustomerSummary,
  updateCustomer,
} from '@/lib/api/customer';
import { UUID } from 'crypto';
import useSWR from 'swr';

export function useCustomer(params?: Query) {
  const { data, error, isLoading, mutate } = useSWR(['customers', params], () =>
    getCustomers(params)
  );

  return {
    customers: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    getCustomerById,
    refresh: mutate,
    createCustomer,
    deleteCustomer,
    updateCustomer,
  };
}

export function useCustomerList(params: Query) {
  const { data, error, isLoading, isValidating } = useSWR(
    ['customers', params],
    () => getCustomers(params),
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  return {
    customers: data?.data ?? [],
    total: data?.pagination.total ?? 0,
    isLoading,
    isRefreshing: isValidating && !isLoading,
    isError: error,
  };
}

export function useCustomerSummary() {
  const { data, isLoading } = useSWR('customer-summary', getCustomerSummary, {
    revalidateOnFocus: false,
  });

  return { summary: data, isLoading };
}

export function useCustomerById(id: UUID) {
  const { data, error, isLoading, mutate } = useSWR(['customer', id], () =>
    getCustomerById(id)
  );

  return {
    customer: data?.data || {},
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
