'use client';

import {
  KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import {
  Check,
  CheckCheck,
  Clock,
  ImageIcon,
  Loader2,
  Search,
  SendHorizontal,
  X,
} from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import {
  formatChatTimestamp,
  formatDayLabel,
  formatMessageTime,
  isWithin24HourWindow,
  messageDayKey,
  renderMessage,
  unixToDate,
} from '@/lib/utils/metaWhatsapp';
import { cn } from '@/lib/utils';
import MediaPreview from './media/MediaPreview';
import { MessageInput } from '@/types/message';
import { formatPhone } from '@/lib/utils/phone';

interface Conversation {
  id: number;
  name: string | null;
  phone_number: string;
  last_message_at: string | null;
}

interface ChatMessage {
  id: number | string;
  direction: 'inbound' | 'outbound';
  message_type: string;
  status: string | null;
  timestamp: number | string | null;
  text_body?: string | null;
  media_id?: string | null;
  file_name?: string | null;
  caption?: string | null;
  template_name?: string | null;
  template_params?: unknown;
}

const PAGE_SIZE = 100;

function displayName(conversation: Conversation) {
  const name = conversation.name?.trim();
  return name || formatPhone(conversation.phone_number);
}

function initials(conversation: Conversation) {
  const name = conversation.name?.trim();
  if (!name) return '#';
  const parts = name.replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return (letters || name[0]).toUpperCase();
}

function Avatar({
  conversation,
  size = 'md',
}: {
  conversation: Conversation;
  size?: 'md' | 'lg';
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary',
        size === 'lg' ? 'h-10 w-10 text-sm' : 'h-9 w-9 text-xs'
      )}
    >
      {initials(conversation)}
    </div>
  );
}

function StatusIcon({ status }: { status: string | null }) {
  switch (status) {
    case 'read':
      return <CheckCheck className="h-3.5 w-3.5 text-sky-200" aria-label="Read" />;
    case 'delivered':
      return <CheckCheck className="h-3.5 w-3.5" aria-label="Delivered" />;
    case 'sent':
      return <Check className="h-3.5 w-3.5" aria-label="Sent" />;
    case 'failed':
      return (
        <span title="Not delivered">
          <X className="h-3.5 w-3.5 text-red-200" strokeWidth={2.5} aria-label="Not delivered" />
        </span>
      );
    default:
      return <Clock className="h-3 w-3" aria-label="Sending" />;
  }
}

function MessageBubble({
  message,
  onOpenImage,
}: {
  message: ChatMessage;
  onOpenImage: (mediaId: string, fileName?: string) => void;
}) {
  const outbound = message.direction === 'outbound';
  const rendered = renderMessage(message);
  const sentAt = message.timestamp ? unixToDate(Number(message.timestamp)) : null;
  return (
    <div className={cn('flex', outbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm lg:max-w-[60%]',
          outbound
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md border bg-card text-card-foreground'
        )}
      >
        {rendered.type === 'image' ? (
          <button
            type="button"
            onClick={() => onOpenImage(rendered.mediaId, rendered.fileName)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
              outbound ? 'bg-white/10 hover:bg-white/20' : 'bg-muted hover:bg-muted/70'
            )}
          >
            <ImageIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{rendered.fileName || 'View photo'}</span>
          </button>
        ) : (
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {rendered.content}
          </p>
        )}
        {message.caption && rendered.type === 'image' && (
          <p className="mt-1.5 whitespace-pre-wrap break-words leading-relaxed">
            {message.caption}
          </p>
        )}

        <div
          className={cn(
            'mt-1 flex items-center justify-end gap-1 text-[11px]',
            outbound ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {sentAt && <span>{formatMessageTime(sentAt)}</span>}
          {outbound && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <Image
        src="/brand/lunaa-icon.png"
        alt=""
        width={300}
        height={300}
        aria-hidden
        className="h-16 w-16 opacity-20"
      />
      <div>
        <p className="font-medium">Select a conversation</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a customer on the left to read and reply to their messages.
        </p>
      </div>
    </div>
  );
}

export default function WhatsAppInbox() {
  const { conversations: convData, isLoading: convLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string>('');
  const {
    messages: msgData,
    isLoading: msgLoading,
    sendMessage,
  } = useConversationMessages(selectedId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [previewMedia, setPreviewMedia] = useState<{
    mediaId: string;
    fileName?: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const conversations: Conversation[] = useMemo(
    () => convData?.data ?? [],
    [convData]
  );

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversations;
    const digits = term.replace(/\D/g, '');
    return conversations.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        (digits.length > 0 && c.phone_number?.includes(digits))
    );
  }, [conversations, searchTerm]);

  const selectedConversation = conversations.find(
    (c) => String(c.id) === selectedId
  );

  const messages: ChatMessage[] = useMemo(
    () => [...(msgData?.data ?? [])].reverse(),
    [msgData]
  );

  const lastInbound = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((m) => m.direction === 'inbound' && m.timestamp),
    [messages]
  );
  const canReply = lastInbound
    ? isWithin24HourWindow(Number(lastInbound.timestamp))
    : false;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm]);

  useEffect(() => {
    setText('');
    setSendError('');
  }, [selectedId]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, selectedId]);

  useLayoutEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const handleSendMessage = async () => {
    const body = text.trim();
    if (!body || !selectedConversation || sending) return;

    const message: MessageInput = {
      to_number: selectedConversation.phone_number,
      body: { text: body },
      direction: 'outbound',
      type: 'text',
    };

    setSending(true);
    setSendError('');
    try {
      await sendMessage(message);
      setText('');
    } catch {
      setSendError('Message failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100svh-3rem)] overflow-hidden md:h-svh bg-background">
      {/* Conversation list */}
      <aside className="flex w-full max-w-[340px] shrink-0 flex-col border-r bg-card">
        <div className="space-y-4 border-b px-6 pb-4 pt-6 lg:px-8 lg:pt-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Inbox
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {convLoading
                ? 'Loading conversations…'
                : `${filteredConversations.length.toLocaleString()} conversations`}
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name or phone"
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convLoading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No conversations match “{searchTerm}”.
            </p>
          ) : (
            <ul className="p-2">
              {filteredConversations.slice(0, visibleCount).map((c) => {
                const active = String(c.id) === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(String(c.id))}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors',
                        active ? 'bg-primary/[0.08]' : 'hover:bg-muted'
                      )}
                    >
                      <Avatar conversation={c} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={cn(
                              'truncate text-sm font-medium',
                              active && 'text-primary'
                            )}
                          >
                            {displayName(c)}
                          </p>
                          {c.last_message_at && (
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {formatChatTimestamp(c.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatPhone(c.phone_number)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
              {filteredConversations.length > visibleCount && (
                <li className="px-2 py-3">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                    className="w-full rounded-lg border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Show more ({(filteredConversations.length - visibleCount).toLocaleString()} left)
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat */}
      <section className="flex min-w-0 flex-1 flex-col">
        {selectedConversation ? (
          <>
            <header className="flex items-center gap-3 border-b bg-card px-5 py-3">
              <Avatar conversation={selectedConversation} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{displayName(selectedConversation)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPhone(selectedConversation.phone_number)}
                </p>
              </div>
              {!msgLoading && (
                <span
                  className={cn(
                    'hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex',
                    canReply
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      canReply ? 'bg-emerald-500' : 'bg-muted-foreground/50'
                    )}
                  />
                  {canReply ? 'Reply window open' : 'Reply window closed'}
                </span>
              )}
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
              {msgLoading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No messages yet.
                </p>
              ) : (
                <div className="mx-auto max-w-3xl space-y-2">
                  {messages.map((m, index) => {
                    const date = m.timestamp ? unixToDate(Number(m.timestamp)) : null;
                    const previous = messages[index - 1];
                    const previousDate = previous?.timestamp
                      ? unixToDate(Number(previous.timestamp))
                      : null;
                    const showDay =
                      date &&
                      (!previousDate || messageDayKey(date) !== messageDayKey(previousDate));

                    return (
                      <div key={m.id} className="space-y-2">
                        {showDay && (
                          <div className="flex justify-center py-2">
                            <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                              {formatDayLabel(date)}
                            </span>
                          </div>
                        )}
                        <MessageBubble
                          message={m}
                          onOpenImage={(mediaId, fileName) =>
                            setPreviewMedia({ mediaId, fileName })
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <footer className="border-t bg-card px-5 py-3">
              {!msgLoading && !canReply && (
                <p className="mb-2 text-xs text-muted-foreground">
                  The customer hasn&apos;t messaged in the last 24 hours, so WhatsApp may
                  reject a normal reply. Send a template instead if it fails.
                </p>
              )}
              {sendError && <p className="mb-2 text-xs text-red-600">{sendError}</p>}
              <div className="flex items-end gap-2">
                <textarea
                  ref={composerRef}
                  rows={1}
                  placeholder="Write a reply…"
                  className="max-h-40 min-h-10 flex-1 resize-none rounded-xl border bg-background px-3.5 py-2.5 text-sm leading-5 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleComposerKeyDown}
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!text.trim() || sending}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Enter to send · Shift + Enter for a new line
              </p>
            </footer>
          </>
        ) : (
          <EmptyChat />
        )}
      </section>

      {previewMedia && (
        <MediaPreview
          mediaId={previewMedia.mediaId}
          fileName={previewMedia.fileName}
          onClose={() => setPreviewMedia(null)}
        />
      )}
    </div>
  );
}
