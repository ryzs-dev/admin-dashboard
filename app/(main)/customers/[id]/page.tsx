'use client';
import CustomerProfile from '@/components/modules/customer/CustomerProfile';
import { useCustomer } from '@/hooks/useCustomer';
import { UUID } from 'crypto';
import { useParams } from 'next/navigation';

export default function IndividualCustomerPage() {
  const { updateCustomer } = useCustomer();
  const params = useParams();

  const { id } = params;

  if (!id) {
    return <div>Customer ID is missing</div>;
  }

  return (
    <div>
      <CustomerProfile customer_id={id as UUID} update={updateCustomer} />
    </div>
  );
}
