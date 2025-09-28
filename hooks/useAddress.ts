
import { createAddress, deleteAddress, getAddresses, updateAddress } from "@/lib/api/address";
import useSWR from "swr";

export function useAddress() {
  const { data, error, isLoading, mutate } = useSWR("orders", () => getAddresses());

  return {
    orders: data?.orders,
    isLoading,
    isError: error,
    refresh: mutate,
    createAddress,
    deleteAddress,
    updateAddress
  };
}