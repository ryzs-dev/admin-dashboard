'use client';

import { useState } from 'react';
import { UUID } from 'crypto';
import { AlertCircle, MapPin, Plus, Store, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDistributors } from '@/hooks/useDistributors';
import { formatPhone } from '@/lib/utils/phone';
import { Distributor, DistributorInput } from '@/types/distributor';
import { DeleteDialog } from '../utils/ui/DeleteDialog';
import DistributorFormDialog from './DistributorFormDialog';

const TH = 'px-6 py-3 text-xs font-medium text-muted-foreground';

type DistributorListProps = {
  subNav?: React.ReactNode;
  onDistributorsChanged?: () => void;
};

export default function DistributorList({
  subNav,
  onDistributorsChanged,
}: DistributorListProps) {
  const {
    distributors,
    isLoading,
    isError,
    refresh,
    createDistributor,
    deleteDistributor,
  } = useDistributors();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addressFor, setAddressFor] = useState<Distributor | null>(null);

  const handleCreate = async (data: DistributorInput) => {
    const result = await createDistributor(data);
    toast.success(
      result.movedOrders
        ? `Distributor added, ${result.movedOrders} existing order(s) moved`
        : 'Distributor added'
    );
    await refresh();
    onDistributorsChanged?.();
    return result.distributor;
  };

  const handleDelete = async (id: UUID) => {
    try {
      await deleteDistributor(id);
      toast.success('Distributor removed');
      await refresh();
      onDistributorsChanged?.();
    } catch (error) {
      console.error('Error removing distributor:', error);
      toast.error('Couldn’t remove the distributor');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Distributors"
          description="Phone numbers whose orders are kept apart from customer orders."
        >
          <Button onClick={() => setIsDialogOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add distributor
          </Button>
        </PageHeader>

        {subNav}

        <DistributorFormDialog
          isOpen={isDialogOpen || addressFor !== null}
          distributor={addressFor}
          onClose={() => {
            setIsDialogOpen(false);
            setAddressFor(null);
          }}
          onSubmit={handleCreate}
          onSaved={() => addressFor && toast.success('Address saved')}
        />

        <Card className="gap-0 overflow-hidden py-0">
          {isError ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <p className="text-sm font-medium text-gray-900">Couldn’t load distributors</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refresh()}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="border-b">
                  <tr>
                    <th className={`${TH} text-left`}>Distributor</th>
                    <th className={`${TH} text-left`}>Phone</th>
                    <th className={`${TH} text-right`}>Orders</th>
                    <th className={`${TH} text-right`}>Added</th>
                    <th className={`${TH} w-24`}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-lg" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-28" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="ml-auto h-4 w-8" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="ml-auto h-4 w-20" />
                        </td>
                        <td />
                      </tr>
                    ))
                  ) : distributors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <Store className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="text-sm font-medium text-gray-900">No distributors yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Add a distributor’s phone number to keep their orders apart.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    distributors.map((distributor) => (
                      <tr key={distributor.id} className="group transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#662d91]/[0.08] text-[#662d91]">
                              <Store className="h-4 w-4" />
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {distributor.name || 'Unnamed distributor'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm tabular-nums text-gray-700">
                          {formatPhone(distributor.phone_number)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm tabular-nums text-gray-900">
                          {distributor.order_count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                          {new Date(distributor.created_at).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              aria-label={`Add an address for ${distributor.name || distributor.phone_number}`}
                              title="Add delivery address"
                              onClick={() => setAddressFor(distributor)}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                            <DeleteDialog
                              title={`Remove ${distributor.name || formatPhone(distributor.phone_number)}?`}
                              description="Their orders move back to Orders as customer orders."
                              onConfirm={() => handleDelete(distributor.id)}
                            >
                              {({ open }) => (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                  aria-label={`Remove ${distributor.name || distributor.phone_number}`}
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
          )}
        </Card>
      </div>
    </div>
  );
}
