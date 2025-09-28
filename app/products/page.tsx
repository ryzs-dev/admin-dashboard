"use client"

import ProductFormDialog from "@/components/modules/products/ProductFormDialog";
import ProductTable from "@/components/modules/products/ProductTable";
import { Product } from "@/components/modules/products/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProducts } from "@/hooks/useProducts";
import { ProductInput } from "@/types/product";
import { UUID } from "crypto";

import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function ProductsPage() {
  const { products, isLoading, isError, refresh,deleteProduct, createProduct, updateProduct } = useProducts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleCreate = async (productData: ProductInput) => {
    try {
      if(editingProduct) {
        await updateProduct(editingProduct.id as UUID, productData);
      } else {
        await createProduct(productData);
      }
      refresh();
      setIsDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error creating/updating product:', error);
    }
  }

  const handleUpdate = (product:Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  }

  const handleDelete = async (productId: UUID) => {
    try {
      await deleteProduct(productId as UUID);
      refresh();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }

  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load products. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return  (
    <div className="mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your products and inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleNewProduct}>
            <Plus className="h-4 w-4 mr-2" />
            New Product
          </Button>
        </div>
      </div>

      <ProductFormDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingProduct(null);
          }}
          onSubmit={handleCreate}
          initialData={editingProduct || undefined}
        />

      <Card>
        <CardContent className="flex flex-col items-center justify-center h-auto">
          {products && products.length > 0 ? (
            <ProductTable products={products} onDelete={handleDelete} onEdit={handleUpdate} />
          ) : (
            <div>No products found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}