import { Query } from '@/components/modules/customer/types';
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from '@/lib/api/customer';
import { UUID } from 'crypto';
import useSWR from 'swr';

export function useCustomer(params?: Query) {
  const { data, error, isLoading, mutate } = useSWR(['customers', params], () =>
    getCustomers(params)
  );

  return {
    customers: data?.data,
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
