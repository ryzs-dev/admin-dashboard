'use client';

import { useState } from 'react';
import { UUID } from 'crypto';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DeleteDialog from '../alert/DeleteDialog';
import { useDistributors } from '@/hooks/useDistributors';

type DistributorListProps = {
  onDistributorsChanged?: () => void;
};

export default function DistributorList({
  onDistributorsChanged,
}: DistributorListProps) {
  const { distributors, isLoading, refresh, createDistributor, deleteDistributor } =
    useDistributors();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<UUID | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Phone number is required');
      return;
    }

    setIsAdding(true);
    try {
      const result = await createDistributor({
        name: name.trim() || undefined,
        phone_number: phoneNumber.trim(),
      });
      toast.success(
        result.movedOrders
          ? `Distributor added, ${result.movedOrders} existing order(s) moved`
          : 'Distributor added'
      );
      setName('');
      setPhoneNumber('');
      await refresh();
      onDistributorsChanged?.();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add distributor'
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);
    try {
      await deleteDistributor(deleteTargetId);
      toast.success('Distributor removed');
      await refresh();
      onDistributorsChanged?.();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove distributor');
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="m-4">
      <Card>
        <CardHeader className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">
              Distributor List
            </h2>
            <p className="text-sm text-gray-500">
              Orders for these phone numbers, including orders sent through
              WhatsApp, appear in the Distributor Orders tab instead of
              Orders.
            </p>
          </div>

          <form onSubmit={handleAdd} className="flex gap-3 max-w-2xl">
            <Input
              placeholder="Phone number, e.g. 0123456789"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={isAdding} className="h-9 gap-1.5">
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Distributor
            </Button>
          </form>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin inline" />
                  </TableCell>
                </TableRow>
              ) : distributors.length ? (
                distributors.map((distributor) => (
                  <TableRow key={distributor.id}>
                    <TableCell>{distributor.name || '-'}</TableCell>
                    <TableCell>{distributor.phone_number}</TableCell>
                    <TableCell>{distributor.order_count}</TableCell>
                    <TableCell>
                      {new Date(distributor.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-600"
                        onClick={() => {
                          setDeleteTargetId(distributor.id);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <p>No distributors yet</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DeleteDialog
        open={isDeleteOpen}
        setOpen={setIsDeleteOpen}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        title="Remove distributor?"
        description="Their orders will move back to the Orders tab as customer orders."
      />
    </div>
  );
}
