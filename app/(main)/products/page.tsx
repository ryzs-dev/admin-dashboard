'use client';

import ProductFormDialog from '@/components/modules/products/ProductFormDialog';
import ProductTable from '@/components/modules/products/ProductTable';
import { Product } from '@/components/modules/products/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProducts } from '@/hooks/useProducts';
import { ProductInput } from '@/types/product';
import { UUID } from 'crypto';

import { AlertCircle, Plus } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Products"
          description="What customers can order, with the code staff type in WhatsApp orders."
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

        <Card className="gap-0 overflow-hidden py-0">
          {isError ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <p className="text-sm font-medium text-gray-900">Couldn’t load products</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refresh()}>
                Try again
              </Button>
            </div>
          ) : (
            <ProductTable
              products={products ?? []}
              isLoading={isLoading}
              onDelete={handleDelete}
              onEdit={handleUpdate}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
