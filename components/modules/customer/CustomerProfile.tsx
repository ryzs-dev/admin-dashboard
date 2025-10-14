import React, { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UUID } from 'crypto';
import { useCustomerById } from '@/hooks/useCustomer';
import { Order } from '../order/types';
import CustomerStatsCard from './CustomerStatsCard';
import { formatCurrency } from '@/lib/utils/currency';
import { CustomerInput } from '@/types/customer';
import { toast } from 'sonner';

interface CustomerProfileProps {
  customer_id: UUID;
  update?: (id: UUID, data: Partial<CustomerInput>) => Promise<void>;
}

export default function CustomerProfile({
  customer_id,
  update,
}: CustomerProfileProps) {
  const { customer } = useCustomerById(customer_id);

  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState<CustomerInput>({
    name: '',
    phone_number: '',
    email: '',
    fb_name: '',
    repeat_customer: 'new',
  });

  useEffect(() => {
    if (customer) setEditForm(customer);
  }, [customer]);

  const handleSave = async () => {
    const updateData: Partial<CustomerInput> = {
      fb_name: editForm.fb_name,
      name: editForm.name,
      phone_number: editForm.phone_number,
      email: editForm.email,
      repeat_customer: editForm.repeat_customer,
    };

    try {
      await update?.(customer_id, updateData);
      toast.success('Customer updated successfully');
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(customer);
  };

  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ✅ Prevent rendering before data exists
  if (!customer) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-screen mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.back();
                }}
              >
                Customers
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{customer.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-row gap-4">
          <div className="w-full gap-4 flex flex-col">
            {/* Header Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="text-2xl">
                        {customer.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span className="text-sm">
                          Customer since {formatDate(customer.created_at)}
                        </span>
                      </CardDescription>
                    </div>
                  </div>

                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editForm.name || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    ) : (
                      <p className="text-sm py-2">{customer.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        type="tel"
                        value={editForm.phone_number || ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            phone_number: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <p className="text-sm py-2">{customer.phone_number}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    ) : (
                      <p className="text-sm py-2">
                        {customer.email || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook Name</Label>
                    {isEditing ? (
                      <Input
                        id="facebook"
                        value={editForm.fb_name || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, fb_name: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    ) : (
                      <p className="text-sm py-2">
                        {customer.fb_name || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Customer Status</Label>
                    {isEditing ? (
                      <Select
                        value={editForm.repeat_customer || 'new'}
                        onValueChange={(value) =>
                          setEditForm({
                            ...editForm,
                            repeat_customer: value as 'returning' | 'new',
                          })
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="returning">Returning</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm py-2 capitalize">
                        {customer.repeat_customer}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order History */}
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                  Complete purchase history for this customer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium">
                            Order ID
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium">
                            Date
                          </th>
                          <th className="h-12 px-4 text-center align-middle font-medium">
                            Status
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {customer?.orders?.map((order: Order) => (
                          <tr key={order.id} className="border-b last:border-0">
                            <td className="h-12 px-4 align-middle">
                              {order.id}
                            </td>
                            <td className="h-12 px-4 align-middle">
                              {order.order_date}
                            </td>
                            <td className="h-12 px-4 align-middle text-center">
                              {order.status}
                            </td>
                            <td className="h-12 px-4 align-middle text-right">
                              {formatCurrency(order.total_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="gap-4 w-1/3 flex flex-col">
            <CustomerStatsCard customer={customer} />
          </div>
        </div>
      </div>
    </div>
  );
}
