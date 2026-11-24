import { supabase } from "@/integrations/supabase/client";
// Generic table access for config-driven pages (table names come from MODULES).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = (table: string) => (supabase as any).from(table);
export const fmt = (v: unknown) => {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
  return String(v);
};
const pad = (n: number) => String(n).padStart(2, "0");
export const toLocalInput = (v?: string | null) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const nowLocal = () => toLocalInput(new Date().toISOString());
export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0] ?? {});
  // Neutralise spreadsheet formula injection (=, +, -, @, tab, CR) by prefixing a quote.
  const esc = (v: unknown) => {
    let t = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
    return `"${t.replace(/"/g, '""')}"`;
  };
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => esc(typeof r[k] === "object" && r[k] !== null ? JSON.stringify(r[k]) : r[k])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}
