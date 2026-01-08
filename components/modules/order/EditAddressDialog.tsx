'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Address = {
  full_address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

type Props = {
  address?: Address;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Address) => Promise<void>;
};

const EditAddressDialog = ({
  address,
  open,
  onOpenChange,
  onSubmit,
}: Props) => {
  const [form, setForm] = React.useState<Address>({
    full_address: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
  });

  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (address) {
      setForm({
        full_address: address.full_address || '',
        city: address.city || '',
        state: address.state || '',
        postcode: address.postcode || '',
        country: address.country || '',
      });
    }
  }, [address]);

  const handleChange = (field: keyof Address, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Shipping Address</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Full Address</Label>
            <Input
              value={form.full_address}
              onChange={(e) => handleChange('full_address', e.target.value)}
              placeholder="Street, building, unit number"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>State</Label>
              <Input
                value={form.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Postcode</Label>
              <Input
                value={form.postcode}
                onChange={(e) => handleChange('postcode', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Country</Label>
              <Input
                value={form.country}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Address'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAddressDialog;
