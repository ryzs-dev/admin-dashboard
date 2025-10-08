'use client';
import CustomerProfile from '@/components/modules/customer/CustomerProfile';
import { UUID } from 'crypto';
import { useParams } from 'next/navigation';

export default function IndividualCustomerPage() {
  const params = useParams();

  const { id } = params;

  return (
    <div>
      <CustomerProfile customer_id={id as UUID} />
    </div>
  );
}
