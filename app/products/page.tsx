/* eslint-disable @typescript-eslint/no-explicit-any */
// app/products/page.tsx - Products Management Page
"use client";

import { useState } from "react";
import {
  useProducts,
  useProductCategories,
  useProductsStats,
  createProduct,
  updateProduct,
  deleteProduct,
  Product,
} from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  RefreshCw,
  Eye,
  EyeOff,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "true" | "false">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const pageSize = 20;

  // Fetch data
  const { products, pagination, isLoading, isError, refresh } = useProducts({
    search: searchQuery.length >= 2 ? searchQuery : undefined,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    is_active: statusFilter === "all" ? undefined : statusFilter,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const { categories } = useProductCategories();
  const { stats } = useProductsStats();

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    product_code: "",
    product_name: "",
    product_type: "",
    size: "",
    description: "",
    base_price: 0,
    category: "",
    is_active: true,
  });

  const handleCreateProduct = async () => {
    try {
      await createProduct(
        formData as Omit<Product, "id" | "created_at" | "updated_at">
      );
      setIsCreateDialogOpen(false);
      setFormData({
        product_code: "",
        product_name: "",
        product_type: "",
        size: "",
        description: "",
        base_price: 0,
        category: "",
        is_active: true,
      });
      refresh();
    } catch (error) {
      console.error("Failed to create product:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create product"
      );
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct?.id) return;

    try {
      await updateProduct(selectedProduct.id, formData);
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      refresh();
    } catch (error) {
      console.error("Failed to update product:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update product"
      );
    }
  };

  const handleDeleteProduct = async (productId: string | number) => {
    if (!confirm("Are you sure you want to deactivate this product?")) return;

    setIsDeleting(productId.toString());
    try {
      await deleteProduct(productId, false); // Soft delete
      refresh();
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete product"
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      product_code: product.product_code,
      product_name: product.product_name,
      product_type: product.product_type || "",
      size: product.size || "",
      description: product.description || "",
      base_price: product.base_price || 0,
      category: product.category || "",
      is_active: product.is_active ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "MYR 0.00";
    return `MYR ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">
            ⚠️ Failed to load products
          </div>
          <Button onClick={refresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage your product catalog
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={refresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Total Products
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.products.total}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Active Products
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.products.active}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <EyeOff className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Inactive Products
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.products.inactive}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Categories
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.products.categories}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories
                    .filter(
                      (category: unknown): category is string | number =>
                        typeof category === "string" ||
                        typeof category === "number"
                    )
                    .map((category: string | number) => (
                      <SelectItem key={category} value={category.toString()}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter as any}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Product Code</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type/Size</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p>Loading products...</p>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No products found</p>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product: Product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm">
                      {product.product_code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {product.product_name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge variant="outline">{product.category}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {product.product_type && (
                          <div>{product.product_type}</div>
                        )}
                        {product.size && (
                          <div className="text-gray-500">{product.size}</div>
                        )}
                        {!product.product_type && !product.size && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.base_price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          product.is_active
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(product.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            product.id && handleDeleteProduct(product.id)
                          }
                          disabled={isDeleting === product.id?.toString()}
                        >
                          {isDeleting === product.id?.toString() ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.total > pageSize && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {pagination.offset + 1}-
                  {Math.min(
                    pagination.offset + pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} products
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage + 1} of{" "}
                    {Math.ceil(pagination.total / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={
                      pagination.offset + pagination.limit >= pagination.total
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Product Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>
                Add a new product to your catalog
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Product Code *</label>
                <Input
                  placeholder="e.g., WASH120ML"
                  value={formData.product_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      product_code: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Product Name *</label>
                <Input
                  placeholder="e.g., Face Wash 120ml"
                  value={formData.product_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      product_name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Input
                    placeholder="e.g., Skincare"
                    value={formData.product_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product_type: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Size</label>
                  <Input
                    placeholder="e.g., 120ml"
                    value={formData.size}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, size: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(
                        (category: unknown): category is string | number =>
                          typeof category === "string" ||
                          typeof category === "number"
                      )
                      .map((category: string | number) => (
                        <SelectItem key={category} value={category.toString()}>
                          {category}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Base Price (MYR)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      base_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Product description..."
                  value={formData.description}
                  onChange={(e: { target: { value: any } }) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProduct}
                disabled={!formData.product_code || !formData.product_name}
              >
                Create Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Update product information</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Product Code *</label>
                <Input
                  value={formData.product_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      product_code: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Product Name *</label>
                <Input
                  value={formData.product_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      product_name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Input
                    value={formData.product_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product_type: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Size</label>
                  <Input
                    value={formData.size}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, size: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(
                        (category: unknown): category is string | number =>
                          typeof category === "string" ||
                          typeof category === "number"
                      )
                      .map((category: string | number) => (
                        <SelectItem key={category} value={category.toString()}>
                          {category}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Base Price (MYR)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      base_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e: { target: { value: any } }) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditProduct}
                disabled={!formData.product_code || !formData.product_name}
              >
                Update Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
