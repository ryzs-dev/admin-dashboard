import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from "@/lib/api/customer";
import useSWR from "swr";

export function useCustomer() {
  const { data, error, isLoading, mutate} = useSWR("customers", () => getCustomers())
  
  return {
    customers: data?.data,
    isLoading,
    isError: error,
    refresh: mutate,
    createCustomer,
    deleteCustomer,
    updateCustomer
  }
}