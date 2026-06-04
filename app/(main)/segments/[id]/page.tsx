'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus, Trash2, Search, Users } from 'lucide-react';
import { useFetchSegmentMembers, useInsertMembers } from '@/hooks/useAudience';
import { useCustomer } from '@/hooks/useCustomer';
import { useDebounce } from '@/hooks/useDebounce';
import { removeUser } from '@/lib/api/audience';
import { getAllCustomerIds } from '@/lib/api/customer'; // add this import
import { toast } from 'sonner';

type FilterOption = 'all' | 'today' | 'week' | 'month';

const FILTER_OPTIONS: FilterOption[] = ['all', 'today', 'week', 'month'];

export default function SegmentManagePage() {
  const { id } = useParams();
  const router = useRouter();

  const { members, segment, refresh } = useFetchSegmentMembers(id as string);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  const customerQuery = useMemo(() => {
    const search = debouncedQuery.trim();
    return {
      ...(search && { search }),
      ...(filter !== 'all' && { filter }),
      limit: 20,
      sortBy: 'created_at',
    };
  }, [debouncedQuery, filter]);

  const { customers, isLoading } = useCustomer(
    open ? customerQuery : undefined
  );

  const { addMembers } = useInsertMembers(id as string);

  // ── Helpers ────────────────────────────────────────────────────
  function closeAndReset() {
    setOpen(false);
    setQuery('');
    setFilter('all');
    refresh();
  }

  // ── Handlers ───────────────────────────────────────────────────
  async function handleAdd(userId: string) {
    setAdding(userId);
    try {
      await addMembers([userId]);
    } finally {
      setAdding(null);
      closeAndReset();
    }
  }

  async function handleAddAll() {
    setAdding('all');
    try {
      const ids = await getAllCustomerIds({
        search: debouncedQuery.trim() || undefined,
        filter,
      });

      if (!ids.length) {
        toast.info('No customers to add');
        return;
      }

      await addMembers(ids);
      toast.success(`Added ${ids.length} members`);
    } catch {
      toast.error('Error adding members');
    } finally {
      setAdding(null);
      closeAndReset();
    }
  }

  async function handleRemove(userId: string) {
    setRemoving(userId);
    try {
      await removeUser(id as string, userId);
      toast.success('Successfully removed user');
    } catch {
      toast.error('Error removing user');
    } finally {
      setRemoving(null);
      refresh();
    }
  }

  return (
    <div className="w-full mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-base font-semibold">
            {segment?.name ?? 'Segment'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {members?.length ?? 0} members
          </p>
        </div>
      </div>

      <Separator />

      {/* Add member */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Members
        </Label>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 gap-1.5"
            >
              <Plus size={12} />
              Add member
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">
                Add member
              </DialogTitle>
            </DialogHeader>

            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border focus-within:ring-1 focus-within:ring-ring">
              <Search size={13} className="text-muted-foreground shrink-0" />
              <input
                autoFocus
                className="flex-1 text-sm bg-transparent outline-none"
                placeholder="Search by name or phone…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize',
                    filter === opt
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Result summary + add all */}
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? 'Searching…'
                  : `Showing ${customers.length} customers`}
              </p>
              {customers.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs px-2.5"
                  onClick={handleAddAll}
                  disabled={adding === 'all'}
                >
                  {adding === 'all' ? 'Adding all…' : 'Add all'}
                </Button>
              )}
            </div>

            {/* Results */}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {isLoading && (
                <p className="text-xs text-muted-foreground px-1 py-2">
                  Loading…
                </p>
              )}

              {!isLoading && customers.length === 0 && (
                <p className="text-xs text-muted-foreground px-1 py-2">
                  No customers found.
                </p>
              )}

              {customers.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-muted/60 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.phone_number}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5 shrink-0 ml-3"
                    disabled={adding === c.id || adding === 'all'}
                    onClick={() => handleAdd(c.id)}
                  >
                    {adding === c.id ? 'Adding…' : 'Add'}
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Member list */}
      <div className="space-y-1.5">
        {members?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Users size={20} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No members yet.</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add members using the button above.
            </p>
          </div>
        )}

        {members?.map((m: any) => (
          <div
            key={m.id}
            className="flex items-center justify-between px-3 py-2.5 rounded-md border bg-card"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.phone_number}</p>
            </div>

            <button
              disabled={removing === m.id}
              onClick={() => handleRemove(m.id)}
              className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 disabled:opacity-40"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
