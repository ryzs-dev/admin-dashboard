import { AlertTriangle, Package, Pencil, Trash2 } from 'lucide-react';
import { UUID } from 'crypto';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/currency';
import { Product } from './types';
import { DeleteDialog } from '../utils/ui/DeleteDialog';

const TH = 'px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500';

export default function ProductTable({
  products,
  isLoading,
  onEdit,
  onDelete,
}: {
  products: Product[];
  isLoading?: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: UUID) => void | Promise<void>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead className="border-b bg-gray-50/80">
          <tr>
            <th className={`${TH} text-left`}>Product</th>
            <th className={`${TH} text-left`}>WhatsApp code</th>
            <th className={`${TH} text-right`}>Price</th>
            <th className={`${TH} w-28`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-5 w-12" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="ml-auto h-4 w-16" />
                </td>
                <td />
              </tr>
            ))
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-16 text-center">
                <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-900">No products yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a product so it can be ordered on WhatsApp.
                </p>
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id} className="group transition-colors hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#662d91]/[0.08] text-[#662d91]">
                      <Package className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-gray-900">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {product.code ? (
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[13px]">
                      {product.code}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Missing, won&apos;t be detected
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm tabular-nums">
                  {Number(product.price) > 0 ? (
                    <span className="font-medium text-gray-900">
                      {formatCurrency(Number(product.price))}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No price set</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      aria-label={`Edit ${product.name}`}
                      onClick={() => onEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DeleteDialog
                      title={`Delete ${product.name}?`}
                      description="It will no longer be available for new orders. This can’t be undone."
                      onConfirm={() => onDelete(product.id as UUID)}
                    >
                      {({ open }) => (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${product.name}`}
                          onClick={open}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </DeleteDialog>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
