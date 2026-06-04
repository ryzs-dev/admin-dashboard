'use client';

import { Button } from '@/components/ui/button';
import { useDeleteWhatsappTemplate } from '@/hooks/useWhatsapp';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  APPROVED: {
    label: 'Approved',
    color: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  PENDING: {
    label: 'Pending',
    color: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-400',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500',
  },
  PAUSED: {
    label: 'Paused',
    color: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  MARKETING: 'bg-violet-100 text-violet-700',
  UTILITY: 'bg-sky-100 text-sky-700',
  AUTHENTICATION: 'bg-orange-100 text-orange-700',
  TRANSACTIONAL: 'bg-teal-100 text-teal-700',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toUpperCase()] ?? {
    label: status,
    color: 'bg-gray-100 text-gray-600 ring-gray-200',
    dot: 'bg-gray-400',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function CategoryBadge({ category }: { category?: string }) {
  if (!category) return null;
  const cls =
    CATEGORY_COLORS[category?.toUpperCase()] ?? 'bg-gray-100 text-gray-600';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {category}
    </span>
  );
}

function TemplateBody({ body }: { body: string }) {
  const parts = body.split(/(\{\{[^}]+\}\})/g);
  return (
    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
      {parts.map((part, i) =>
        /^\{\{[^}]+\}\}$/.test(part) ? (
          <span
            key={i}
            className="inline-block bg-[#25D366]/10 text-[#128C5E] font-mono text-[11px] px-1.5 py-0.5 rounded border border-[#25D366]/20 mx-0.5"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </p>
  );
}

function EmptyDetail() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-300 select-none">
      <svg
        className="w-14 h-14 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
      <p className="text-sm font-medium">Select a template to preview</p>
    </div>
  );
}

function DetailPanel({ t }: { t: any }) {
  return (
    <div className="h-full flex flex-col">
      {/* Detail header */}
      <div className="px-6 py-4 border-b border-stone-200">
        <div className="flex items-start justify-between flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              {t.name}
            </h2>
            <p className="text-xs text-slate-400 font-mono ">
              {t.language}
              {t.id && <span className="ml-2 text-slate-300">#{t.id}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={t.category} />
            <StatusBadge status={t.status} />
          </div>
        </div>
      </div>

      {/* Scrollable detail body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-gray-200">
        {/* Message body */}
        {t.body && (
          <section>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Message Body
            </p>
            {/* WhatsApp-style bubble */}
            <div className="relative ml-3 bg-white rounded-xl rounded-tl-sm p-4 border border-stone-200 shadow-sm max-w-lg">
              <div className="absolute -left-2 top-0 w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent" />
              <div className="absolute -left-[9px] top-0 w-0 h-0 border-t-[10px] border-t-stone-200 border-l-[10px] border-l-transparent" />
              <TemplateBody body={t.body} />
            </div>
          </section>
        )}

        {/* Variables */}
        {t.variables?.length > 0 && (
          <section>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Variables
            </p>
            <div className="flex flex-wrap gap-2">
              {t.variables.map((v: string) => (
                <span
                  key={v}
                  className="text-xs bg-[#25D366]/10 text-[#128C5E] border border-[#25D366]/20 font-mono px-2.5 py-1 rounded-md"
                >
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Buttons */}
        {t.buttons?.length > 0 && (
          <section>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Quick Replies / CTAs
            </p>
            <div className="flex flex-wrap gap-2">
              {t.buttons.map((b: any, i: number) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs border border-stone-200 bg-white text-slate-600 px-3 py-1.5 rounded-full shadow-sm font-medium hover:border-[#25D366] hover:text-[#128C5E] transition-colors cursor-default"
                >
                  {b.type === 'URL' && (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  )}
                  {b.type === 'PHONE_NUMBER' && (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  )}
                  {b.text}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function WhatsappTemplateList({
  templates,
}: {
  templates: any[];
}) {
  const { deleteTemplate } = useDeleteWhatsappTemplate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | number | null>(
    templates?.[0]?.id ?? null
  );

  const selected = templates?.find((t) => t.id === selectedId) ?? null;

  const handleDelete = async (id: string, name: string) => {
    try {
      setDeletingId(id);

      await deleteTemplate({ templateId: id, templateName: name });
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete template. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!templates?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <svg
          className="w-12 h-12 mb-3 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <p className="text-sm font-medium">No templates found</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto h-[85vh] flex rounded-2xl overflow-hidden border border-stone-200 shadow-lg">
      {/* ── Sidebar ── */}
      <aside className="w-72 flex-shrink-0 flex flex-col border-r border-stone-200 bg-stone-50/90">
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-stone-200 bg-stone-50">
          <h1 className="text-sm font-semibold text-slate-700 tracking-tight">
            Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Template list */}
        <nav className="flex-1 overflow-y-auto ">
          {templates.map((t) => {
            const isActive = t.id === selectedId;
            const statusDot = (
              STATUS_CONFIG[t.status?.toUpperCase()] ?? STATUS_CONFIG.PAUSED
            ).dot;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors duration-150 relative
                    ${
                      isActive
                        ? 'bg-white shadow-sm border-y border-stone-200'
                        : 'hover:bg-white/60'
                    }`}
              >
                {/* Active left bar */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#25D366] to-[#128C5E]" />
                )}

                {/* Status dot */}
                <span
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot}`}
                />

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm truncate ${isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'}`}
                  >
                    {t.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {t.language}
                    </span>
                    {t.category && <CategoryBadge category={t.category} />}
                  </div>
                </div>

                <Button
                  disabled={deletingId === t.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(t.id, t.name);
                  }}
                  variant="outline"
                  size="icon"
                  className="ml-auto  group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Detail panel ── */}
      <main className="flex-1 min-w-0 bg-white">
        {selected ? <DetailPanel t={selected} /> : <EmptyDetail />}
      </main>
    </div>
  );
}
