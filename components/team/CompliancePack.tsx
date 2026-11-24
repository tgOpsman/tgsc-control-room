import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AREAS: { label: string; table: string; col: string; issue?: [string, string] }[] = [
  { label: "Fire LogBook", table: "fire_logs", col: "logged_at" },
  { label: "CCTV checks", table: "cctv_logs", col: "logged_at" },
  { label: "Radon monitoring", table: "radon_tests", col: "test_start", issue: ["status", "action_level_exceeded"] },
  { label: "Key cabinet audits", table: "key_audits", col: "audit_date", issue: ["status", "issues_outstanding"] },
  { label: "Defect reports", table: "defect_reports", col: "report_datetime", issue: ["status", "open"] },
  { label: "Contractor callouts", table: "contractor_callouts", col: "called_at", issue: ["status", "open"] },
  { label: "Car park patrols", table: "car_park_patrols", col: "patrol_start" },
  { label: "Evacuations & drills", table: "evacuation_events", col: "started_at" },
  { label: "Shift handovers", table: "handover_reports", col: "created_at" },
];

export function CompliancePack() {
  const { name } = useAuth();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [y, m] = month.split("-").map(Number) as [number, number];
  const from = new Date(y, m - 1, 1).toISOString(), to = new Date(y, m, 1).toISOString();
  const pf = new Date(y, m - 2, 1).toISOString();
  const { data = [], isLoading } = useQuery({
    queryKey: ["pack", month],
    queryFn: () => Promise.all(AREAS.map(async (a) => {
      const c = async (s: string, e: string, issue?: boolean) => {
        let q = db(a.table).select("id", { count: "exact", head: true }).gte(a.col, s).lt(a.col, e);
        if (issue && a.issue) q = q.eq(a.issue[0], a.issue[1]);
        return (await q).count ?? 0;
      };
      return { ...a, now: await c(from, to), prev: await c(pf, from), issues: a.issue ? await c(from, to, true) : 0 };
    })),
  });
  const pct = (n: number, p: number) => (p ? `${n >= p ? "+" : ""}${Math.round(((n - p) / p) * 100)}%` : "—");
  return (
    <div className="p-6 md:p-8 max-w-[1100px] mx-auto">
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Monthly Compliance Pack</h1>
          <p className="text-muted-foreground text-sm">The Galleries Shopping Centre · 9 compliance areas compared with the previous month.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" aria-label="Month" />
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
        </div>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary text-primary-foreground text-left"><tr><th className="px-3 py-2">Area</th><th className="px-3 py-2">Records</th><th className="px-3 py-2">Previous</th><th className="px-3 py-2">Change</th><th className="px-3 py-2">Outstanding</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {data.map((a) => (
              <tr key={a.table} className="border-t">
                <td className="px-3 py-2 font-medium">{a.label}</td>
                <td className="px-3 py-2 font-mono">{a.now}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">{a.prev}</td>
                <td className="px-3 py-2 font-mono">{pct(a.now, a.prev)}</td>
                <td className={`px-3 py-2 font-mono ${a.issues ? "text-destructive font-bold" : ""}`}>{a.issue ? a.issues : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid sm:grid-cols-3 gap-6 mt-10 text-sm">
        <div><div className="border-b h-10" /><div className="text-muted-foreground mt-1">Manager signature</div></div>
        <div><div className="border-b h-10 flex items-end">{name}</div><div className="text-muted-foreground mt-1">Prepared by</div></div>
        <div><div className="border-b h-10 flex items-end">{new Date().toLocaleDateString("en-GB")}</div><div className="text-muted-foreground mt-1">Date</div></div>
      </div>
    </div>
  );
}
