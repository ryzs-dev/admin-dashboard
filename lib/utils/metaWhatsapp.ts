import { templateRenderers } from './templateRenderers';

export function isWithin24HourWindow(lastInboundTimestamp: number): boolean {
  const now = Date.now(); // current time in ms
  const lastInbound = lastInboundTimestamp * 1000; // convert unix seconds → ms
  const hoursPassed = (now - lastInbound) / (1000 * 60 * 60); // hours
  return hoursPassed <= 24;
}

export function unixToGMT8(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

export function formatChatTimestamp(isoString: string): string {
  const messageDateUTC = new Date(isoString); // original UTC date
  const messageDate = new Date(messageDateUTC.getTime() + 8 * 60 * 60 * 1000); // convert to GMT+8
  const now = new Date();

  // Start of today in GMT+8
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);

  // Today
  if (messageDate >= startOfToday) {
    const hours = String(messageDate.getHours()).padStart(2, '0');
    const minutes = String(messageDate.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Yesterday
  if (messageDate >= startOfYesterday) {
    return 'Yesterday';
  }

  // Older messages → show date
  const day = String(messageDate.getDate()).padStart(2, '0');
  const month = String(messageDate.getMonth() + 1).padStart(2, '0');
  const year = messageDate.getFullYear();

  // Optional: show full date if not this year
  if (year !== now.getFullYear()) {
    return `${day}/${month}/${year}`;
  }

  return `${day}/${month}`;
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
