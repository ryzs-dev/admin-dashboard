'use client';

import ProductFormDialog from '@/components/modules/products/ProductFormDialog';
import ProductTable from '@/components/modules/products/ProductTable';
import { Product } from '@/components/modules/products/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProducts } from '@/hooks/useProducts';
import { ProductInput } from '@/types/product';
import { UUID } from 'crypto';

import { AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ProductsPage() {
  const {
    products,
    isLoading,
    isError,
    refresh,
    deleteProduct,
    createProduct,
    updateProduct,
  } = useProducts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleCreate = async (productData: ProductInput) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id as UUID, productData);
    } else {
      await createProduct(productData);
    }
    toast.success(editingProduct ? 'Product updated' : 'Product added');
    refresh();
  };

  const handleUpdate = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: UUID) => {
    try {
      await deleteProduct(productId as UUID);
      toast.success('Product deleted');
      refresh();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Couldn’t delete the product');
    }
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

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

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Products"
        description="Manage your products and inventory."
      >
        <Button onClick={handleNewProduct} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New product
        </Button>
      </PageHeader>

      <ProductFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleCreate}
        initialData={editingProduct || undefined}
        existingProducts={products ?? []}
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center h-auto">
          {products && products.length > 0 ? (
            <ProductTable
              products={products}
              onDelete={handleDelete}
              onEdit={handleUpdate}
            />
          ) : (
            <div>No products found.</div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
