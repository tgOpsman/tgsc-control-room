import { db } from "./db";

// Entries saved while the internet is down; replayed in order when it comes back.
export type Queued = { id: string; table: string; payload: Record<string, unknown>; at: string; error?: string };
const KEY = "offline-queue-v1";
const EVT = "offline-queue-change";
export const readQueue = (): Queued[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } };
const write = (q: Queued[]) => { localStorage.setItem(KEY, JSON.stringify(q)); window.dispatchEvent(new Event(EVT)); };
export const onQueueChange = (fn: () => void) => { window.addEventListener(EVT, fn); return () => window.removeEventListener(EVT, fn); };
export const isNetworkError = (e: { message?: string } | null | undefined) =>
  (typeof navigator !== "undefined" && !navigator.onLine) || /failed to fetch|network|load failed|fetch failed/i.test(e?.message ?? "");

/** Insert a row; if the internet is down, keep it locally and return queued=true. */
export async function insertOrQueue(table: string, payload: Record<string, unknown>): Promise<{ error: { message: string } | null; queued: boolean }> {
  const res = navigator.onLine ? await db(table).insert(payload).then((r: { error: { message: string } | null }) => r, (e: Error) => ({ error: e })) : { error: { message: "offline" } };
  if (!res.error) return { error: null, queued: false };
  if (!isNetworkError(res.error) && res.error.message !== "offline") return { error: res.error, queued: false };
  const at = new Date().toISOString();
  write([...readQueue(), { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, table, payload: { ...payload, extra: { ...((payload["extra"] as object) ?? {}), saved_offline_at: at } }, at }]);
  return { error: null, queued: true };
}

let flushing = false;
/** Replay queued entries oldest first. Stops at the first network failure. */
export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  if (flushing || !navigator.onLine) return { synced: 0, failed: 0 };
  flushing = true;
  let synced = 0, failed = 0;
  try {
    for (const item of readQueue()) {
      if (item.error) { failed++; continue; }
      const { error } = await db(item.table).insert(item.payload).then((r: { error: { message: string } | null }) => r, (e: Error) => ({ error: e }));
      if (error && isNetworkError(error)) break;
      write(error ? readQueue().map((q) => (q.id === item.id ? { ...q, error: error.message } : q)) : readQueue().filter((q) => q.id !== item.id));
      if (error) failed++; else synced++;
    }
  } finally { flushing = false; }
  return { synced, failed };
}
export const discardQueued = (id: string) => write(readQueue().filter((q) => q.id !== id));
