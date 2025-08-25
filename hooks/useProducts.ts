// hooks/useProducts.ts - Frontend hooks for Products and Packages management
import useSWR from "swr";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// ============================================================================
// INTERFACES
// ============================================================================

export interface Product {
  id?: number;
  product_code: string;
  product_name: string;
  product_type?: string;
  size?: string;
  description?: string;
  base_price?: number;
  is_active?: boolean;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Package {
  id?: number;
  package_name: string;
  package_code?: string;
  description?: string;
  base_price?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProductFilters {
  category?: string;
  is_active?: "true" | "false" | "all";
  limit?: number;
  offset?: number;
  search?: string;
}

interface PackageFilters {
  is_active?: "true" | "false" | "all";
  limit?: number;
  offset?: number;
  search?: string;
}

// ============================================================================
// PRODUCTS HOOKS
// ============================================================================

// Hook for fetching products
export function useProducts(filters?: ProductFilters) {
  const queryParams = new URLSearchParams();

  if (filters?.category) queryParams.append("category", filters.category);
  if (filters?.is_active) queryParams.append("is_active", filters.is_active);
  if (filters?.search) queryParams.append("search", filters.search);
  if (filters?.limit) queryParams.append("limit", filters.limit.toString());
  if (filters?.offset) queryParams.append("offset", filters.offset.toString());

  const { data, error, isLoading, mutate } = useSWR(
    `${API_BASE_URL}/api/products?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 0, // Don't auto-refresh
      revalidateOnFocus: false,
    }
  );

  return {
    products: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for getting a single product
export function useProduct(productId?: string | number) {
  const { data, error, isLoading, mutate } = useSWR(
    productId ? `${API_BASE_URL}/api/products/${productId}` : null,
    fetcher
  );

  return {
    product: data?.data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for product categories
export function useProductCategories() {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_BASE_URL}/api/products/meta/categories`,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );

  return {
    categories: data?.data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// ============================================================================
// PACKAGES HOOKS
// ============================================================================

// Hook for fetching packages
export function usePackages(filters?: PackageFilters) {
  const queryParams = new URLSearchParams();

  if (filters?.is_active) queryParams.append("is_active", filters.is_active);
  if (filters?.search) queryParams.append("search", filters.search);
  if (filters?.limit) queryParams.append("limit", filters.limit.toString());
  if (filters?.offset) queryParams.append("offset", filters.offset.toString());

  const { data, error, isLoading, mutate } = useSWR(
    `${API_BASE_URL}/api/packages?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );

  return {
    packages: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for getting a single package
export function usePackage(packageId?: string | number) {
  const { data, error, isLoading, mutate } = useSWR(
    packageId ? `${API_BASE_URL}/api/packages/${packageId}` : null,
    fetcher
  );

  return {
    package: data?.data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for products and packages statistics
export function useProductsStats() {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_BASE_URL}/api/products/meta/stats`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    stats: data?.data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// ============================================================================
// MUTATION FUNCTIONS
// ============================================================================

// Create product
export async function createProduct(
  productData: Omit<Product, "id" | "created_at" | "updated_at">
) {
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to create product");
  }

  return response.json();
}

// Update product
export async function updateProduct(
  productId: string | number,
  updates: Partial<Product>
) {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to update product");
  }

  return response.json();
}

// Delete product
export async function deleteProduct(
  productId: string | number,
  hardDelete = false
) {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${productId}?hard_delete=${hardDelete}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to delete product");
  }

  return response.json();
}

// Create package
export async function createPackage(
  packageData: Omit<Package, "id" | "created_at" | "updated_at">
) {
  const response = await fetch(`${API_BASE_URL}/api/packages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(packageData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to create package");
  }

  return response.json();
}

// Update package
export async function updatePackage(
  packageId: string | number,
  updates: Partial<Package>
) {
  const response = await fetch(`${API_BASE_URL}/api/packages/${packageId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to update package");
  }

  return response.json();
}

// Delete package
export async function deletePackage(
  packageId: string | number,
  hardDelete = false
) {
  const response = await fetch(
    `${API_BASE_URL}/api/products/packages/${packageId}?hard_delete=${hardDelete}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to delete package");
  }

  return response.json();
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

// Hook for active products (commonly used in forms)
export function useActiveProducts() {
  return useProducts({ is_active: "true", limit: 1000 });
}

// Hook for active packages (commonly used in forms)
export function useActivePackages() {
  return usePackages({ is_active: "true", limit: 1000 });
}

// Combined hook for products and packages
export function useProductsAndPackages() {
  const products = useActiveProducts();
  const packages = useActivePackages();

  return {
    products: products.products,
    packages: packages.packages,
    isLoading: products.isLoading || packages.isLoading,
    isError: products.isError || packages.isError,
    refresh: () => {
      products.refresh();
      packages.refresh();
    },
  };
}
