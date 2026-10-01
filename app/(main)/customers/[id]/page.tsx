'use client';
import CustomerProfile from '@/components/modules/customer/CustomerProfile';
import { updateCustomer } from '@/lib/api/customer';
import { UUID } from 'crypto';
import { useParams } from 'next/navigation';

export default function IndividualCustomerPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {id ? (
          <CustomerProfile customer_id={id as UUID} update={updateCustomer} />
        ) : (
          <p className="text-sm text-muted-foreground">Customer ID is missing.</p>
        )}
      </div>
    </div>
  );
}
