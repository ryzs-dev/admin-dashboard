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
import { UUID } from 'crypto';

type Courier = 'shopee_express' | 'flash' | 'jnt' | 'kex' | 'sf_express';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracking: {
    id: UUID;
    tracking_number?: string;
    courier?: Courier;
    message_status?: string;
  };
  onSubmit: (
    trackingId: UUID,
    payload: {
      tracking_number: string;
      courier: Courier;
      message_status: string;
    }
  ) => Promise<void>;
}

export function UpdateTrackingDialog({
  open,
  onOpenChange,
  tracking,
  onSubmit,
}: Props) {
  const [trackingNumber, setTrackingNumber] = useState(
    tracking.tracking_number ?? ''
  );
  const [courier, setCourier] = useState<Courier | ''>(tracking.courier ?? '');
  const [status, setStatus] = useState(tracking.message_status ?? 'pending');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!courier) return;
    setLoading(true);
    await onSubmit(tracking.id, {
      tracking_number: trackingNumber,
      courier,
      message_status: status,
    });
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 shadow-sm">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-lg font-medium text-gray-900">
            Update Tracking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Input
              placeholder="Tracking Number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="h-10 border-gray-200 focus:border-gray-400 focus:ring-0"
            />
          </div>

          <div>
            <Select
              value={courier}
              onValueChange={(value) => setCourier(value as Courier | '')}
            >
              <SelectTrigger className="h-10 border-gray-200 focus:border-gray-400 focus:ring-0">
                <SelectValue placeholder="Select Courier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spx">Shopee Express</SelectItem>
                <SelectItem value="flash">Flash</SelectItem>
                <SelectItem value="jnt">J&T</SelectItem>
                <SelectItem value="kex">KEX</SelectItem>
                <SelectItem value="sf_express">SF Express</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10 border-gray-200 focus:border-gray-400 focus:ring-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !trackingNumber || !courier}
            className="h-9 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
