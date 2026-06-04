'use client';

import { useState } from 'react';
import AutomationEditor from './AutomationEditor';
import { useFetchAutomation } from '@/hooks/useAutomation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const NEW_SENTINEL = '__new__';

export default function AutomationBuilder() {
  const { automations, refresh } = useFetchAutomation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = automations?.find((a: any) => a.id === selectedId) ?? null;
  const isNew = selectedId === NEW_SENTINEL;

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* LEFT: LIST */}
      <div className="w-72 border-r flex flex-col shrink-0">
        <div className="px-4 py-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold tracking-tight">
              Automations
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {automations?.length ?? 0} configured
            </p>
          </div>
          <button
            onClick={() => setSelectedId(NEW_SENTINEL)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              isNew
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Plus size={15} />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {automations?.map((a: any) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-md transition-colors',
                  selectedId === a.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted/60'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Zap
                    size={13}
                    className={cn(
                      'shrink-0',
                      a.is_active ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span className="text-sm font-medium truncate">{a.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 pl-5 truncate">
                  {a.trigger_event}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT: EDITOR */}
      <div className="flex-1 overflow-auto">
        {!selectedId && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Zap
                size={24}
                className="text-muted-foreground/30 mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">
                Select an automation
              </p>
            </div>
          </div>
        )}

        {isNew && (
          <AutomationEditor
            key="new"
            isNew
            onSave={() => {
              refresh();
              setSelectedId(null);
            }}
          />
        )}

        {selected && (
          <AutomationEditor
            key={selected.id}
            automation={selected}
            onToggle={refresh}
            onSave={refresh}
          />
        )}
      </div>
    </div>
  );
}
