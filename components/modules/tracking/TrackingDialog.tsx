'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderTrackingInput } from './types';
import { Courier } from './UpdateTrackingDialog';

interface TrackingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSubmit: (tracking: OrderTrackingInput) => Promise<void>;
  initialData?: OrderTrackingInput;
  mode?: 'edit' | 'add';
}

const carriers = [
  { value: 'Best Express', label: 'Best Express' },
  { value: 'Flash Express', label: 'Flash Express' },
  { value: 'Shopee Express', label: 'Shopee Express' },
  { value: 'SF Express', label: 'SF Express' },
  { value: 'Pos Laju', label: 'Pos Laju' },
  { value: 'J&T Express', label: 'J&T Express' },
];

const trackingStatuses = [
  { label: 'Pending', value: 'pending' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Returned', value: 'returned' },
];

export default function TrackingDialog({
  isOpen,
  onClose,
  orderId,
  onSubmit,
  initialData,
  mode = 'add',
}: TrackingDialogProps) {
  const [formData, setFormData] = useState<OrderTrackingInput>({
    tracking_number: '',
    courier: undefined,
    status: 'pending',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        tracking_number: initialData?.tracking_number || '',
        courier: initialData?.courier ?? undefined,
        status: initialData?.status || 'pending',
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Tracking' : 'Add Tracking'} for {orderId}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tracking_number">Tracking Number</Label>
            <Input
              id="tracking_number"
              value={formData.tracking_number}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  tracking_number: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Courier</Label>
            <Select
              value={formData.courier}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  courier: value as Courier,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select courier" />
              </SelectTrigger>
              <SelectContent>
                {carriers.map((carrier) => (
                  <SelectItem key={carrier.value} value={carrier.value}>
                    {carrier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  status: value as OrderTrackingInput['status'],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {trackingStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'edit' ? 'Save Changes' : 'Add Tracking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
