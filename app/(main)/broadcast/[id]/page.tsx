'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Mail,
  Users,
  Clock,
  CalendarIcon,
  Play,
  User,
  User2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useFetchBroadcast } from '@/hooks/useBroadcast'; // placeholder
import { useFetchSegments } from '@/hooks/useAudience';
import { toast } from 'sonner';
import { triggerBroadcast } from '@/lib/api/broadcast';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  completed: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-muted/50 border">
      <Icon size={13} className="text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm truncate">{value}</p>
      </div>
    </div>
  );
}

export default function BroadcastDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { broadcast, refresh } = useFetchBroadcast(id as string);
  const { segments } = useFetchSegments();
  const [triggering, setTriggering] = useState(false);

  console.log(segments);

  async function handleTrigger(id: string) {
    try {
      setTriggering(true);
      await triggerBroadcast(id);
      toast.success(`Successfully triggered ${broadcast.name} `);
    } catch {
      toast.error('Error sending broadcast');
    } finally {
      setTriggering(false);
      refresh();
    }
  }

  if (!broadcast) return null;

  const canTrigger =
    broadcast.status === 'draft' || broadcast.status === 'scheduled';

  console.log('Broadcast details:', broadcast); // Debug log

  return (
    <div className="max-2-5xl mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold truncate">
                {broadcast.name}
              </h1>
              <Badge
                className={`text-[10px] px-1.5 py-0 h-4 rounded-full border-0 shrink-0 ${STATUS_STYLES[broadcast.status] ?? ''}`}
              >
                {broadcast.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Broadcast details
            </p>
          </div>
        </div>

        {canTrigger && (
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 shrink-0"
            disabled={triggering}
            onClick={() => handleTrigger(broadcast.id)}
          >
            <Play size={12} />
            {triggering ? 'Sending…' : 'Send now'}
          </Button>
        )}
      </div>

      <Separator />

      {/* Details */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Details
        </p>
        <div className="space-y-1.5">
          <DetailRow
            icon={Mail}
            label="Template"
            value={broadcast.template_name}
          />
          <DetailRow
            icon={CalendarIcon}
            label="Scheduled at"
            value={
              broadcast.scheduled_at
                ? format(new Date(broadcast.scheduled_at), 'dd MMM yyyy, HH:mm')
                : 'Not scheduled'
            }
          />
          <DetailRow
            icon={Clock}
            label="Created at"
            value={format(new Date(broadcast.created_at), 'dd MMM yyyy, HH:mm')}
          />
        </div>
      </div>

      {/* Segments */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Recipients
        </p>
        <div className="space-y-1.5">
          <DetailRow
            icon={User2}
            label="Segments"
            value={`${broadcast.segment.name} (${broadcast.segment.members.length}) `}
          />
        </div>
      </div>

      {/* Stats — shown only for completed */}
      {broadcast.status === 'completed' && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Results
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total', value: broadcast.total_recipients },
                { label: 'Sent', value: broadcast.sent_count },
                { label: 'Failed', value: broadcast.failed_count },
              ].map((s) => (
                <div
                  key={s.label}
                  className="px-3 py-3 rounded-md border bg-card text-center"
                >
                  <p className="text-lg font-semibold">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
