'use client';

import {
  TemplateComponent,
  TemplatePayload,
  useCreateWhatsappTemplate,
} from '@/hooks/useWhatsapp';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// ─── Tiny helpers ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
      {children}
    </p>
  );
}

// ─── Live preview bubble ───────────────────────────────────────────────────────

function PreviewBubble({
  header,
  body,
  footer,
  buttons,
}: {
  header?: TemplateComponent;
  body: string;
  footer?: string;
  buttons: string[];
}) {
  const highlight = (text: string) =>
    text.split(/(\{\{[^}]+\}\})/g).map((p, i) =>
      /^\{\{[^}]+\}\}$/.test(p) ? (
        <span
          key={i}
          className="bg-[#25D366]/15 text-[#128C5E] font-mono text-[11px] px-1 rounded"
        >
          {p}
        </span>
      ) : (
        p
      )
    );

  const hasContent = body || header || footer || buttons.length > 0;

  return (
    <div
      className="flex-1 flex flex-col justify-end p-3 overflow-y-auto"
      style={{
        backgroundColor: '#e5ddd5',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4d0c8' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {!hasContent ? (
        <p className="text-center text-xs text-stone-400 mb-4">
          Preview will appear here
        </p>
      ) : (
        <div className="flex flex-col items-start gap-1">
          <div className="bg-white rounded-xl rounded-tl-sm shadow-sm border border-stone-100 max-w-[90%] overflow-hidden">
            {header?.type === 'HEADER' && header.format !== 'TEXT' && (
              <div className="bg-stone-100 h-20 flex items-center justify-center">
                <span className="text-xs text-stone-400">{header.format}</span>
              </div>
            )}
            <div className="px-3 py-2 space-y-1">
              {header?.type === 'HEADER' &&
                header.format === 'TEXT' &&
                header.text && (
                  <p className="text-sm font-semibold text-slate-900">
                    {highlight(header.text)}
                  </p>
                )}
              {body && (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {highlight(body)}
                </p>
              )}
              {footer && <p className="text-[11px] text-slate-400">{footer}</p>}
              <p className="text-[10px] text-slate-300 text-right">
                12:00 PM ✓✓
              </p>
            </div>
          </div>
          {buttons.length > 0 && (
            <div className="w-[30%] space-y-1 mt-0.5">
              {buttons.map((b, i) => (
                <div
                  key={i}
                  className="bg-white border border-stone-200 rounded-lg py-1.5 text-center text-xs font-medium text-sky-500 shadow-sm"
                >
                  {b || (
                    <span className="text-slate-300 italic">
                      Button {i + 1}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TemplateForm({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}) {
  const { createTemplate, loading } = useCreateWhatsappTemplate();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY'>(
    'MARKETING'
  );
  const [language, setLanguage] = useState<'en_US' | 'zh_CN'>('en_US');
  const [components, setComponents] = useState<TemplateComponent[]>([
    { type: 'BODY', text: '' },
    { type: 'FOOTER', text: '' },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const headerComponent = components.find((c) => c.type === 'HEADER');
  const bodyComponent = components.find((c) => c.type === 'BODY');
  const footerComponent = components.find((c) => c.type === 'FOOTER');
  const buttonsBlock = components.find((c) => c.type === 'BUTTONS');
  const previewButtons =
    buttonsBlock?.type === 'BUTTONS'
      ? buttonsBlock.buttons.map((b) => b.text)
      : [];

  const hasCopyCode = buttonsBlock?.buttons.some((b) => b.type === 'COPY_CODE');

  // Header
  const addHeaderText = () =>
    !headerComponent &&
    setComponents((p) => [{ type: 'HEADER', format: 'TEXT', text: '' }, ...p]);
  const addMediaHeader = (format: 'IMAGE' | 'VIDEO' | 'DOCUMENT') =>
    !headerComponent &&
    setComponents((p) => [{ type: 'HEADER', format, mediaId: '' }, ...p]);
  const removeHeader = () =>
    setComponents((p) => p.filter((c) => c.type !== 'HEADER'));
  const updateHeaderText = (v: string) =>
    setComponents((p) =>
      p.map((c) =>
        c.type === 'HEADER' && c.format === 'TEXT' ? { ...c, text: v } : c
      )
    );
  const updateHeaderMedia = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload-media', { method: 'POST', body: fd });
    const data = await res.json();
    setComponents((p) =>
      p.map((c) =>
        c.type === 'HEADER' && c.format !== 'TEXT'
          ? { ...c, mediaId: data.media_id }
          : c
      )
    );
  };

  // Body
  const updateBody = (v: string) =>
    setComponents((p) =>
      p.map((c) => (c.type === 'BODY' ? { ...c, text: v } : c))
    );

  // Footer
  const updateFooter = (v: string) =>
    setComponents((p) =>
      p.map((c) => (c.type === 'FOOTER' ? { ...c, text: v } : c))
    );

  // Buttons
  const addButtonsBlock = () =>
    !buttonsBlock &&
    setComponents((p) => [...p, { type: 'BUTTONS', buttons: [] }]);
  const addQuickReply = (
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'FLOW' | 'COPY_CODE'
  ) =>
    setComponents((p) =>
      p.map((c) =>
        c.type === 'BUTTONS'
          ? {
              ...c,
              buttons: [
                ...c.buttons,
                {
                  type,
                  text: '',
                  ...(type === 'URL' ? { url: '' } : {}),
                  ...(type === 'PHONE_NUMBER' ? { phone_number: '' } : {}),
                  ...(type === 'FLOW' ? { flow_id: '' } : {}),
                  ...(type === 'COPY_CODE' ? { example: '' } : {}),
                },
              ],
            }
          : c
      )
    );
  const updateButtonText = (i: number, value: string) =>
    setComponents((prev) =>
      prev.map((c) =>
        c.type === 'BUTTONS'
          ? {
              ...c,
              buttons: c.buttons.map((b, bi) =>
                bi === i
                  ? {
                      ...b,
                      text: value,
                      ...(b.type === 'URL' && !b.url ? { url: value } : {}),
                    }
                  : b
              ),
            }
          : c
      )
    );

  const updateButtonUrl = (i: number, value: string) =>
    setComponents((prev) =>
      prev.map((c) =>
        c.type === 'BUTTONS'
          ? {
              ...c,
              buttons: c.buttons.map((b, bi) =>
                bi === i ? { ...b, url: value } : b
              ),
            }
          : c
      )
    );

  const updateButtonPhone = (i: number, value: string) =>
    setComponents((prev) =>
      prev.map((c) =>
        c.type === 'BUTTONS'
          ? {
              ...c,
              buttons: c.buttons.map((b, bi) =>
                bi === i ? { ...b, phone_number: value } : b
              ),
            }
          : c
      )
    );

  const updateButtonCode = (i: number, value: string) =>
    setComponents((prev) =>
      prev.map((c) =>
        c.type === 'BUTTONS'
          ? {
              ...c,
              buttons: c.buttons.map((b, bi) =>
                bi === i ? { ...b, example: value } : b
              ),
            }
          : c
      )
    );

  const removeButton = (i: number) =>
    setComponents((p) =>
      p.map((c) =>
        c.type === 'BUTTONS'
          ? { ...c, buttons: c.buttons.filter((_, bi) => bi !== i) }
          : c
      )
    );

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: TemplatePayload = {
      name: name.toLowerCase(),
      language,
      category,
      components: components.filter((c) => {
        if (c.type === 'FOOTER') {
          return c.text.trim() !== ''; // 👈 exclude empty footer
        }
        return true;
      }),
    };

    console.log(components);
    try {
      await createTemplate(payload);
      setSubmitted(true);
      setTimeout(() => {
        resetForm();
        setSubmitted(false);
        onSuccess?.();
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  //   Reset
  const resetForm = () => {
    setName('');
    setCategory('MARKETING');
    setComponents([{ type: 'BODY', text: '' }]);
    setSubmitted(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="flex h-[600px]">
          {/* ── Left: Form ── */}
          <div className="flex flex-col w-[55%] border-r border-stone-200">
            <DialogHeader className="px-5 py-4 border-b border-stone-100 bg-stone-50 flex-shrink-0">
              <DialogTitle className="text-sm font-semibold text-slate-700">
                New Template
              </DialogTitle>
              <p className="text-xs text-slate-400">WhatsApp Business API</p>
            </DialogHeader>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
            >
              {/* Name + Category */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-slate-400">
                    Name
                  </Label>
                  <Input
                    placeholder="order_confirmed"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-slate-400">
                    Category
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(v) =>
                      setCategory(v as 'MARKETING' | 'UTILITY')
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="UTILITY">Utility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-slate-400">
                    Language
                  </Label>
                  <Select
                    value={language}
                    onValueChange={(v) => setLanguage(v as 'en_US' | 'zh_CN')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_US">English</SelectItem>
                      <SelectItem value="zh_CN">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Header */}
              {!headerComponent ? (
                <div>
                  <SectionLabel>Header (optional)</SectionLabel>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Text', 'Image', 'Video', 'Document'] as const).map(
                      (t) => (
                        <Button
                          key={t}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs border-dashed"
                          onClick={() =>
                            t === 'Text'
                              ? addHeaderText()
                              : addMediaHeader(t.toUpperCase() as any)
                          }
                        >
                          {t}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <SectionLabel>Header</SectionLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-slate-400 h-auto py-0"
                      onClick={removeHeader}
                    >
                      Remove
                    </Button>
                  </div>
                  {headerComponent.format === 'TEXT' ? (
                    <Input
                      placeholder="Header text"
                      value={headerComponent.text ?? ''}
                      onChange={(e) => updateHeaderText(e.target.value)}
                    />
                  ) : (
                    <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-stone-300 text-xs text-slate-500 cursor-pointer hover:border-[#25D366] hover:text-[#128C5E] transition-all w-full">
                      Upload {headerComponent.format?.toLowerCase()}
                      <input
                        type="file"
                        className="hidden"
                        accept={
                          headerComponent.format === 'IMAGE'
                            ? 'image/*'
                            : headerComponent.format === 'VIDEO'
                              ? 'video/*'
                              : '*'
                        }
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) updateHeaderMedia(f);
                        }}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Body */}
              <div>
                <SectionLabel>Body</SectionLabel>
                <Textarea
                  className="resize-none"
                  rows={3}
                  placeholder="Hi {{1}}, your order {{2}} is confirmed! 🎉"
                  value={bodyComponent?.text ?? ''}
                  onChange={(e) => updateBody(e.target.value)}
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Use{' '}
                  <code className="bg-stone-100 px-1 rounded font-mono">
                    {'{{1}}'}
                  </code>{' '}
                  for variables
                </p>
              </div>

              {/* Footer */}
              <div>
                <SectionLabel>Footer (optional)</SectionLabel>
                <Input
                  placeholder="Reply STOP to unsubscribe"
                  value={footerComponent?.text ?? ''}
                  onChange={(e) => updateFooter(e.target.value)}
                />
              </div>

              {/* Buttons */}
              {!buttonsBlock ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-400 px-0 h-auto"
                  onClick={addButtonsBlock}
                >
                  + Add buttons
                </Button>
              ) : (
                <div>
                  {/* HEADER */}
                  <div className="flex items-center justify-between mb-2">
                    <SectionLabel>Buttons</SectionLabel>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-400 h-auto py-0"
                        onClick={() =>
                          setComponents((prev) =>
                            prev.filter((c) => c.type !== 'BUTTONS')
                          )
                        }
                      >
                        Remove
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-400 h-auto py-0"
                        onClick={() =>
                          setComponents((prev) =>
                            prev.map((c) =>
                              c.type === 'BUTTONS' ? { ...c, buttons: [] } : c
                            )
                          )
                        }
                      >
                        Reset
                      </Button>
                    </div>
                  </div>

                  {/* BUTTON LIST */}
                  <div className="space-y-2">
                    {buttonsBlock.buttons.map((b, i) => (
                      <div
                        key={i}
                        className="flex-col space-y-2 border p-2 rounded-lg"
                      >
                        {/* TYPE LABEL (optional but nice UX) */}
                        <p className="text-[11px] text-slate-400">
                          {b.type.replace('_', ' ')}
                        </p>

                        {/* TEXT ONLY FOR NON COPY_CODE */}
                        {b.type !== 'COPY_CODE' && (
                          <Input
                            placeholder={`Button ${i + 1} label`}
                            value={b.text}
                            onChange={(e) =>
                              updateButtonText(i, e.target.value)
                            }
                          />
                        )}

                        {/* URL INPUT */}
                        {b.type === 'URL' && (
                          <Input
                            placeholder="https://example.com"
                            value={b.url ?? ''}
                            onChange={(e) => updateButtonUrl(i, e.target.value)}
                          />
                        )}

                        {/* PHONE INPUT */}
                        {b.type === 'PHONE_NUMBER' && (
                          <Input
                            placeholder="+60123456789"
                            value={b.phone_number ?? ''}
                            onChange={(e) =>
                              updateButtonPhone(i, e.target.value)
                            }
                          />
                        )}

                        {/* FLOW INPUT (optional) */}
                        {b.type === 'FLOW' && (
                          <Input
                            placeholder="Flow ID"
                            value={b.flow_id ?? ''}
                            onChange={(e) =>
                              setComponents((prev) =>
                                prev.map((c) =>
                                  c.type === 'BUTTONS'
                                    ? {
                                        ...c,
                                        buttons: c.buttons.map((btn, bi) =>
                                          bi === i
                                            ? {
                                                ...btn,
                                                flow_id: e.target.value,
                                              }
                                            : btn
                                        ),
                                      }
                                    : c
                                )
                              )
                            }
                          />
                        )}

                        {b.type === 'COPY_CODE' && (
                          <Input
                            placeholder="Promo code (e.g. SAVE20)"
                            value={b.example}
                            onChange={(e) =>
                              updateButtonCode(i, e.target.value)
                            }
                          />
                        )}

                        {/* DELETE */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-400"
                          onClick={() => removeButton(i)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}

                    {/* ADD BUTTON SELECT */}
                    {buttonsBlock.buttons.length < 3 && (
                      <div className="flex items-center gap-2 pt-1">
                        <Select
                          onValueChange={(value) =>
                            addQuickReply(
                              value as
                                | 'QUICK_REPLY'
                                | 'URL'
                                | 'PHONE_NUMBER'
                                | 'FLOW'
                                | 'COPY_CODE'
                            )
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Add button type" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="QUICK_REPLY">
                              Quick Reply
                            </SelectItem>
                            <SelectItem value="URL">URL</SelectItem>
                            <SelectItem value="PHONE_NUMBER">
                              Phone Number
                            </SelectItem>
                            <SelectItem value="FLOW">Flow</SelectItem>
                            <SelectItem
                              value="COPY_CODE"
                              disabled={hasCopyCode}
                            >
                              Copy Code {hasCopyCode && '(Only 1 allowed)'}
                            </SelectItem>{' '}
                          </SelectContent>
                        </Select>

                        <span className="text-xs text-slate-400">
                          {buttonsBlock.buttons.length}/3
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>

            <DialogFooter className="px-5 py-3 border-t border-stone-100 bg-stone-50 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
                className="text-red-400 hover:text-red-600 border border-red-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || submitted}
                className={`min-w-[130px] ${submitted ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-[#25D366] hover:bg-[#22c55e]'} text-white`}
              >
                {submitted ? (
                  '✓ Created!'
                ) : loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </div>

          {/* ── Right: Preview ── */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-4 border-b border-stone-100 bg-stone-50 flex-shrink-0">
              <p className="text-sm font-semibold text-slate-700">
                Live Preview
              </p>
              <p className="text-xs text-slate-400">How it looks on WhatsApp</p>
            </div>
            <PreviewBubble
              header={headerComponent}
              body={bodyComponent?.text ?? ''}
              footer={footerComponent?.text}
              buttons={previewButtons}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
