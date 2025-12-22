'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderTrackingInput } from './types';
import { Courier } from './UpdateTrackingDialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: OrderTrackingInput) => Promise<void>;
}

export function CreateTrackingDialog({ open, onOpenChange, onSubmit }: Props) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState<Courier | ''>('');
  const [status, setStatus] = useState<OrderTrackingInput['status']>('pending');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit({
      tracking_number: trackingNumber,
      courier: courier as Courier,
      status,
    });
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tracking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />

          <Select
            value={courier}
            onValueChange={(value) => setCourier(value as Courier)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Courier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spx">Shopee Express</SelectItem>
              <SelectItem value="flash">Flash</SelectItem>
              <SelectItem value="jnt">J&T</SelectItem>
              <SelectItem value="kex">KEX</SelectItem>
              <SelectItem value="sf_express">SF Express</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as OrderTrackingInput['status'])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !trackingNumber || !courier}
          >
            {loading ? 'Saving...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
