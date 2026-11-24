// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function musterSummary(rows: any[]) {
  let accounted = 0, missing = 0, pending = 0, partial = 0;
  for (const r of rows) {
    const n = Number(r.people ?? 1);
    if (r.status === "accounted") { accounted += n; if (r.extra?.expected && n < Number(r.extra.expected)) partial++; }
    else if (r.status === "missing") missing += n;
    else pending += n;
  }
  return { accounted, missing, pending, partial, cards: rows.length };
}
