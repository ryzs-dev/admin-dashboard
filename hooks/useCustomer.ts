import { CustomerQuery } from "@/components/modules/customer/types";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "@/lib/api/customer";
import useSWR from "swr";

export function useCustomer(params?: CustomerQuery) {
  const { data, error, isLoading, mutate } = useSWR(["customers", params], () =>
    getCustomers(params)
  );

  return {
    customers: data?.data,
    pagination: data?.pagination,
    isLoading,
    isError: error,
    refresh: mutate,
    createCustomer,
    deleteCustomer,
    updateCustomer,
  };
}
