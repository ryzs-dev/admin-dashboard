'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateSegment, useFetchSegments } from '@/hooks/useAudience';
import { Trash, Users } from 'lucide-react';
import { deleteSegment } from '@/lib/api/audience';
import { toast } from 'sonner';

export default function SegmentsPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { segments, refresh } = useFetchSegments();
  const { createSegment, isCreating } = useCreateSegment(); // placeholder hook
  const router = useRouter();

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    await createSegment({ name });
    setName('');
    setLoading(false);
    refresh();
  }

  async function handleDelete(id: string) {
    try {
      setLoading(true);
      await deleteSegment(id);
      toast.success('Successfully deleted segment');
    } catch {
      toast.error('Error deleting segment');
    } finally {
      setLoading(false);
      refresh();
    }
  }

  return (
    <div className="w-full mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold">Segments</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your audience groups
        </p>
      </div>

      {/* Create */}
      <div className="flex gap-2">
        <Input
          className="h-8 text-sm"
          placeholder="Segment name e.g. VIP Customers"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={loading || !name.trim() || isCreating}
        >
          Create
        </Button>
      </div>

      {/* List */}
      <div className="space-y-1.5">
        {segments?.length === 0 && (
          <p className="text-xs text-muted-foreground px-1">No segments yet.</p>
        )}
        {segments?.map((seg: any) => (
          <div
            key={seg.id}
            className="flex items-center justify-between px-3 py-2.5 rounded-md border bg-card"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1 rounded bg-muted shrink-0">
                <Users size={12} className="text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{seg.name}</p>
                <p className="text-xs text-muted-foreground">
                  {seg.segment_members?.[0]?.count ?? 0} members{' '}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5 shrink-0"
                onClick={() => router.push(`/segments/${seg.id}`)}
              >
                Manage
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5 shrink-0"
                onClick={() => handleDelete(seg.id)}
              >
                <Trash size={11} className="text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
