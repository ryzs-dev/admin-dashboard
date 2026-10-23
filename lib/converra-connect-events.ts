/**
 * The Converra approval runs in its own tab. When the callback tab finishes, it tells the
 * Integrations tab over a same-origin channel (BroadcastChannel, with a localStorage
 * fallback) so that page refreshes without the user reloading.
 */
const CHANNEL = 'converra-connect';
const STORAGE_KEY = 'converra-connect-event';

export type ConverraConnectEvent =
  | { type: 'connected'; workspaceName: string | null }
  | { type: 'failed'; message: string };

export function announceConverraConnect(event: ConverraConnectEvent) {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(event);
    channel.close();
  } catch {
    // BroadcastChannel unavailable — the storage event below still reaches other tabs.
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...event, at: Date.now() }));
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked; nothing else to do.
  }
}

export function onConverraConnect(handler: (event: ConverraConnectEvent) => void): () => void {
  let channel: BroadcastChannel | null = null;
  let lastAt = 0;
  const deliver = (event: ConverraConnectEvent) => {
    // Both transports can fire for one event; ignore the duplicate.
    const now = Date.now();
    if (now - lastAt < 1000) return;
    lastAt = now;
    handler(event);
  };
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (message) => deliver(message.data as ConverraConnectEvent);
  } catch {
    channel = null;
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      deliver(JSON.parse(e.newValue) as ConverraConnectEvent);
    } catch {
      // Ignore malformed values.
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    channel?.close();
    window.removeEventListener('storage', onStorage);
  };
}
