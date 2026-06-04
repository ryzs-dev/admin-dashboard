'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Radio, Play, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useFetchBroadcasts } from '@/hooks/useBroadcast'; // placeholder
import BroadcastForm from '@/components/modules/broadcast/BroadcastForm';
import { deleteBroadcast } from '@/lib/api/broadcast';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  completed: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
};

export default function BroadcastsPage() {
  const router = useRouter();
  const { broadcasts, refresh } = useFetchBroadcasts();
  const [open, setOpen] = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);

  console.log('Broadcasts:', broadcasts); // Debug log

  // async function handleTrigger(e: React.MouseEvent, id: string) {
  //   e.stopPropagation();
  //   setTriggering(id);
  //   await fetch(`/api/broadcasts/${id}/trigger`, { method: 'POST' });
  //   setTriggering(null);
  //   refresh();
  // }

  async function handleDelete(e: React.MouseEvent, id: string) {
    try {
      e.stopPropagation();
      await deleteBroadcast(id);
      toast.success('Broadcast deleted successfully');
    } catch {
      toast.error('Error deleting broadcast');
    } finally {
      refresh();
    }
  }

  return (
    <div className="max-2-5xl mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Broadcasts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {broadcasts?.length ?? 0} total
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <Plus size={13} />
              New broadcast
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">
                Create broadcast
              </DialogTitle>
            </DialogHeader>
            <BroadcastForm
              onSave={() => {
                setOpen(false);
                refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* List */}
      <div className="space-y-1.5">
        {broadcasts?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Radio size={20} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No broadcasts yet.</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create one using the button above.
            </p>
          </div>
        )}

        {broadcasts?.map((b: any) => (
          <div
            key={b.id}
            onClick={() => router.push(`/broadcast/${b.id}`)}
            className="flex items-center justify-between px-3 py-3 rounded-md border bg-card hover:bg-muted/40 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1.5 rounded bg-muted shrink-0">
                <Radio size={12} className="text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <Badge
                    className={`text-[10px] px-1.5 py-0 h-4 rounded-full border-0 shrink-0 ${STATUS_STYLES[b.status] ?? ''}`}
                  >
                    {b.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {b.template_name} ·{' '}
                  {b.scheduled_at
                    ? format(new Date(b.scheduled_at), 'dd MMM yyyy, HH:mm')
                    : format(new Date(b.created_at), 'dd MMM yyyy')}
                </p>
              </div>
            </div>

            <div className="flex">
              {/* Manual trigger — only for draft/scheduled */}
              {(b.status === 'draft' || b.status === 'scheduled') && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-2.5 gap-1.5 shrink-0 ml-3"
                  disabled={triggering === b.id}
                  // onClick={(e) => handleTrigger(e, b.id)}
                >
                  <Play size={11} />
                  {triggering === b.id ? 'Sending…' : 'Send now'}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 gap-1.5 shrink-0 ml-3"
                onClick={(e) => {
                  handleDelete(e, b.id);
                }}
              >
                <Trash size={11} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
