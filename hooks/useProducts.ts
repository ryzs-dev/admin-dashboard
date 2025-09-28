
import { createProduct, deleteProduct, getAllProducts, updateProduct } from "@/lib/api/product";
import useSWR from "swr";

export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR("products", () => getAllProducts());

  return {
    products: data?.products,
    isLoading,
    isError: error,
    refresh: mutate,
    deleteProduct,
    createProduct,
    updateProduct
  };
}