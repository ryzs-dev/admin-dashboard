import { templateRenderers } from './templateRenderers';

export function isWithin24HourWindow(lastInboundTimestamp: number): boolean {
  const now = Date.now(); // current time in ms
  const lastInbound = lastInboundTimestamp * 1000; // convert unix seconds → ms
  const hoursPassed = (now - lastInbound) / (1000 * 60 * 60); // hours
  return hoursPassed <= 24;
}

const MALAYSIA_TZ = 'Asia/Kuala_Lumpur';

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: MALAYSIA_TZ });
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: MALAYSIA_TZ,
  hour: '2-digit',
  minute: '2-digit',
});
const shortDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: MALAYSIA_TZ,
  day: 'numeric',
  month: 'short',
});
const longDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: MALAYSIA_TZ,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function toDayKey(date: Date) {
  return dayKeyFormatter.format(date);
}

function relativeDay(date: Date): 'today' | 'yesterday' | null {
  const now = new Date();
  const key = toDayKey(date);
  if (key === toDayKey(now)) return 'today';
  if (key === toDayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000))) {
    return 'yesterday';
  }
  return null;
}

export function unixToDate(unixSeconds: number): Date {
  return new Date(unixSeconds * 1000);
}

export function unixToGMT8(unixSeconds: number): string {
  const date = unixToDate(unixSeconds);
  return `${toDayKey(date).replace(/-/g, '/')} ${timeFormatter.format(date)}`;
}

export function formatMessageTime(date: Date): string {
  return timeFormatter.format(date);
}

export function messageDayKey(date: Date): string {
  return toDayKey(date);
}

export function formatDayLabel(date: Date): string {
  const relative = relativeDay(date);
  if (relative === 'today') return 'Today';
  if (relative === 'yesterday') return 'Yesterday';
  return longDateFormatter.format(date);
}

export function formatChatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const relative = relativeDay(date);
  if (relative === 'today') return timeFormatter.format(date);
  if (relative === 'yesterday') return 'Yesterday';
  if (date.getFullYear() !== new Date().getFullYear()) {
    return toDayKey(date).split('-').reverse().join('/');
  }
  return shortDateFormatter.format(date);
}

export function renderMessage(
  message: any
):
  | { type: 'text'; content: string }
  | { type: 'image'; mediaId: string; fileName?: string } {
  if (message.message_type === 'template') {
    const renderer = message.template_name
      ? templateRenderers[message.template_name]
      : null;
    if (renderer && message.template_params) {
      return { type: 'text', content: renderer(message.template_params) };
    }
    return { type: 'text', content: '[Template message not found]' };
  }

  if (message.message_type === 'text' && message.text_body) {
    return { type: 'text', content: message.text_body };
  }

  if (message.message_type === 'image') {
    return {
      type: 'image',
      mediaId: message.media_id,
      fileName: message.file_name,
    };
  }

  return { type: 'text', content: '[Unknown message type]' };
}
