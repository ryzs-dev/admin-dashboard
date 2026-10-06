'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { ArrowLeft, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import DeleteDialog from '@/components/modules/alert/DeleteDialog';
import { errorMessage } from '@/components/forms/FormDialog';
import {
  DuplicateCustomer,
  getDuplicateCustomers,
  mergeCustomers,
} from '@/lib/api/customer';
import { formatCurrency } from '@/lib/utils/currency';
import { formatPhone } from '@/lib/utils/phone';

export default function DuplicateCustomersPage() {
  const { data, isLoading, mutate } = useSWR('duplicate-customers', getDuplicateCustomers);
  const [pending, setPending] = useState<{ keep: DuplicateCustomer; merge: DuplicateCustomer } | null>(null);
  const [merging, setMerging] = useState(false);

  const confirm = async () => {
    if (!pending) return;
    setMerging(true);
    try {
      await mergeCustomers(pending.keep.id, pending.merge.id);
      toast.success(`Merged into ${pending.keep.name || 'the customer you kept'}`);
      setPending(null);
      await mutate();
    } catch (err) {
      toast.error(errorMessage(err, 'Couldn’t merge these customers. Please try again.'));
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Customers
        </Link>
        <PageHeader
          title="Possible duplicates"
          description="Same name, different phone number. Merging moves every order onto the customer you keep."
        />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Looking through customers…</p>
        ) : !data?.length ? (
          <div className="rounded-xl border bg-card px-6 py-16 text-center">
            <Users className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" />
            <p className="text-sm font-medium">No customers share a name</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{data.length} groups</p>
            {data.map((group) => (
              <section key={group.key} className="overflow-hidden rounded-xl border bg-card">
                <div className="border-b px-5 py-3">
                  <h2 className="font-medium capitalize">{group.key}</h2>
                </div>
                <ul className="divide-y">
                  {group.customers.map((customer) => (
                    <li key={customer.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                          {customer.name || 'Unnamed customer'}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatPhone(customer.phone_number)} · {customer.total_purchase_count ?? 0}{' '}
                          {(customer.total_purchase_count ?? 0) === 1 ? 'order' : 'orders'} ·{' '}
                          {formatCurrency(Number(customer.total_amount_spent || 0))}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.customers
                          .filter((other) => other.id !== customer.id)
                          .map((other) => (
                            <Button
                              key={other.id}
                              size="sm"
                              variant="outline"
                              onClick={() => setPending({ keep: customer, merge: other })}
                            >
                              Merge {other.name || 'the other'} in
                            </Button>
                          ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <DeleteDialog
        open={!!pending}
        setOpen={(open) => !open && setPending(null)}
        isLoading={merging}
        title={`Merge into ${pending?.keep.name || 'this customer'}?`}
        description={
          pending
            ? `${pending.merge.name || 'The other customer'} (${formatPhone(pending.merge.phone_number)}) will be removed. Their orders move to ${pending.keep.name || 'the customer you are keeping'}.`
            : ''
        }
        confirmLabel="Merge"
        onConfirm={confirm}
      />
    </div>
  );
}
