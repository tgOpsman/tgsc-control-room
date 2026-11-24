/** Keys/equipment out 24h+ and patrols running 12h+ need attention. */
export const KEY_OVERDUE_H = 24;
export const PATROL_STALE_H = 12;
export const hoursSince = (iso: string, now = Date.now()) => (now - new Date(iso).getTime()) / 3.6e6;
export const isLoanOverdue = (issuedAt: string, now = Date.now()) => hoursSince(issuedAt, now) >= KEY_OVERDUE_H;
export const isPatrolStale = (start: string, now = Date.now()) => hoursSince(start, now) >= PATROL_STALE_H;
/** Quarter bounds (UTC dates) for year/quarter 1-4. */
export const quarterRange = (year: number, q: number) => ({ start: new Date(Date.UTC(year, (q - 1) * 3, 1)), end: new Date(Date.UTC(year, q * 3, 1)) });
/** Regular visitors: same name+company seen at least `min` times, most frequent first. */
export function frequentVisitors<T extends { full_name: string; company?: string | null }>(rows: T[], min = 2, limit = 8) {
  const m = new Map<string, { row: T; n: number }>();
  for (const r of rows) {
    const k = `${r.full_name.trim().toLowerCase()}|${(r.company ?? "").trim().toLowerCase()}`;
    const e = m.get(k); if (e) e.n++; else m.set(k, { row: r, n: 1 });
  }
  return [...m.values()].filter((e) => e.n >= min).sort((a, b) => b.n - a.n).slice(0, limit);
}
