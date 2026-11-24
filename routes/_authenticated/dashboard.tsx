import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [
    { title: "KPI Dashboard — Control Room Manager" },
    { name: "description", content: "Monthly KPIs across vehicles, access, keys, security and compliance." },
    { property: "og:title", content: "KPI Dashboard — Control Room Manager" },
    { property: "og:description", content: "Monthly KPIs across vehicles, access, keys, security and compliance." },
  ] }),
  component: Dashboard,
});

const SECTIONS: { title: string; stats: [string, string, string, Record<string, string>?][] }[] = [
  { title: "Vehicle Management", stats: [["Total visits", "vehicle_visits", "check_in_time"], ["Still on site", "vehicle_visits", "check_in_time", { status: "active" }]] },
  { title: "Access Control", stats: [["Check-ins", "check_in_records", "check_in_time"], ["Contractors", "check_in_records", "check_in_time", { visit_type: "Contractor" }], ["Roof/Plant access", "check_in_records", "check_in_time", { visit_type: "RoofAccess" }]] },
  { title: "Key & Equipment", stats: [["Keys issued", "key_logs", "issued_at"], ["Key mismatches", "key_logs", "issued_at", { count_mismatch: "true" }], ["Equipment issued", "asset_logs", "issued_at"]] },
  { title: "Security Operations", stats: [["CCTV checks", "cctv_logs", "logged_at"], ["CT incidents", "ct_incidents", "start_datetime"], ["Patrols", "car_park_patrols", "patrol_start"], ["Barrier raises", "barrier_raise_logs", "raised_at"]] },
  { title: "Maintenance & Compliance", stats: [["Contractor callouts", "contractor_callouts", "called_at"], ["Handover reports", "handover_reports", "created_at"], ["Fire log entries", "fire_logs", "logged_at"], ["Radon tests", "radon_tests", "test_start"], ["Defects reported", "defect_reports", "report_datetime"], ["Spillages", "spillage_logs", "spilled_at"]] },
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function Dashboard() {
  const now = new Date();
  const [m, setM] = useState(now.getMonth());
  const [y, setY] = useState(now.getFullYear());
  const { data } = useQuery({
    queryKey: ["kpi", m, y],
    queryFn: async () => {
      const a = new Date(y, m, 1).toISOString(), b = new Date(y, m + 1, 1).toISOString();
      const out: Record<string, number> = {};
      await Promise.all(SECTIONS.flatMap((s) => s.stats.map(async ([l, t, f, eq]) => {
        let q = db(t).select("id", { count: "exact", head: true }).gte(f, a).lt(f, b);
        for (const [k, v] of Object.entries(eq ?? {})) q = q.eq(k, v);
        const { count } = await q;
        out[s.title + l] = count ?? 0;
      })));
      return out;
    },
  });
  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div><h1 className="text-3xl font-bold">KPI Dashboard</h1><p className="text-muted-foreground text-sm">Management overview for {MONTHS[m]} {y}</p></div>
        <div className="flex gap-2 print:hidden">
          <select className="border rounded-md px-2 bg-card" value={m} onChange={(e) => setM(+e.target.value)}>{MONTHS.map((n, i) => <option key={n} value={i}>{n}</option>)}</select>
          <select className="border rounded-md px-2 bg-card" value={y} onChange={(e) => setY(+e.target.value)}>{[0, 1, 2].map((d) => <option key={d}>{now.getFullYear() - d}</option>)}</select>
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Management PDF</Button>
        </div>
      </div>
      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-semibold mb-2">{s.title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {s.stats.map(([l]) => (
                <div key={l} className="bg-card border rounded-lg p-4"><div className="text-3xl font-bold font-mono">{data?.[s.title + l] ?? "–"}</div><div className="text-xs text-muted-foreground mt-1">{l}</div></div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
