'use client';

import { FormEvent, useState } from 'react';
import useSWR from 'swr';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { addStaffPhone, getStaffPhones, removeStaffPhone, StaffPhone } from '@/lib/api/staff-phones';

const display = (phone: string) => (phone.startsWith('60') ? `0${phone.slice(2)}` : `+${phone}`);

export function StaffPhonesSettings({ onSaving }: { onSaving?: (state: 'idle' | 'saving' | 'saved') => void }) {
  const { data, error, mutate } = useSWR('staff-phones', getStaffPhones, { revalidateOnFocus: false });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<StaffPhone | null>(null);

  const run = async (work: () => Promise<StaffPhone[]>) => {
    onSaving?.('saving');
    try {
      mutate(await work(), { revalidate: false });
      onSaving?.('saved');
      setTimeout(() => onSaving?.('idle'), 2000);
      return true;
    } catch (failure) {
      onSaving?.('idle');
      toast.error(failure instanceof Error ? failure.message : 'Couldn’t save the change');
      return false;
    }
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    setAdding(true);
    const saved = await run(() => addStaffPhone({ name, phone_number: phone }));
    setAdding(false);
    if (saved) {
      setName('');
      setPhone('');
    }
  };

  if (!data) {
    return error ? (
      <Card className="px-5 py-10 text-center text-sm text-muted-foreground">
        Couldn’t load the staff numbers. Reload to try again.
      </Card>
    ) : (
      <Skeleton className="h-64" />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="space-y-1.5 text-sm font-medium">
            Name
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mynn" required />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            WhatsApp number
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="012 345 6789"
              inputMode="tel"
              required
            />
          </label>
          <Button type="submit" disabled={adding}>
            {adding ? 'Adding…' : 'Add number'}
          </Button>
        </form>
      </Card>

      <Card className="divide-y divide-border">
        {data.map((staff) => (
          <div key={staff.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{staff.name}</p>
              <p className="text-sm text-muted-foreground">{display(staff.phone_number)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${staff.name}`}
              disabled={data.length <= 1}
              onClick={() => setRemoving(staff)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </Card>

      <p className="text-sm text-muted-foreground">
        Only these numbers can send orders and receipts to the WhatsApp bot. Changes apply within a minute.
      </p>

      <AlertDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Orders sent from {removing ? display(removing.phone_number) : ''} will stop being created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removing) run(() => removeStaffPhone(removing.id));
                setRemoving(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
