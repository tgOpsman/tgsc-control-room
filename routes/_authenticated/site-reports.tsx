import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/site-reports")({
  head: () => ({
    meta: [
      { title: "Site Reports — Control Room Manager" },
      { name: "description", content: "Summary of every log for a chosen date range." },
      { property: "og:title", content: "Site Reports — Control Room Manager" },
      { property: "og:description", content: "Summary of every log for a chosen date range." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reports,
});

const SOURCES: [string, string, string][] = [
  ["Person check-ins", "check_in_records", "check_in_time"], ["Vehicle visits", "vehicle_visits", "check_in_time"],
  ["Key loans", "key_logs", "issued_at"], ["Equipment loans", "asset_logs", "issued_at"],
  ["Defects", "defect_reports", "report_datetime"], ["Spillages", "spillage_logs", "spilled_at"],
  ["Contractor callouts", "contractor_callouts", "called_at"], ["Barrier raises", "barrier_raise_logs", "raised_at"],
  ["Car park patrols", "car_park_patrols", "patrol_start"], ["Fire log entries", "fire_logs", "logged_at"],
  ["CCTV log entries", "cctv_logs", "logged_at"], ["Weather / BMS", "weather_logs", "logged_at"],
  ["Radon tests", "radon_tests", "test_start"], ["Vacant unit checks", "vacant_unit_checks", "checked_at"],
  ["Lost & found", "found_properties", "item_date"], ["Evacuations / drills", "evacuation_events", "started_at"],
  ["Bomb threats", "bomb_threats", "received_at"], ["Handovers", "handover_reports", "shift_date"],
];
const day = (d: Date) => d.toISOString().slice(0, 10);

function Reports() {
  const [from, setFrom] = useState(day(new Date(Date.now() - 30 * 864e5)));
  const [to, setTo] = useState(day(new Date()));
  const { data, isFetching } = useQuery({
    queryKey: ["site-report", from, to],
    queryFn: async () => {
      const end = new Date(to); end.setDate(end.getDate() + 1);
      return Promise.all(SOURCES.map(async ([label, t, col]) => {
        const { count, error } = await db(t).select("id", { count: "exact", head: true }).gte(col, from).lt(col, day(end));
        return { label, n: error ? null : count ?? 0 };
      }));
    },
  });
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div><h1 className="text-2xl md:text-3xl font-bold">Site Reports</h1><p className="text-sm text-muted-foreground">{from} to {to}</p></div>
        <div className="flex gap-2 items-end print:hidden">
          <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {(data ?? []).map((r) => (
          <div key={r.label} className="bg-card border rounded-xl p-4 break-inside-avoid">
            <div className="text-3xl font-bold font-mono">{r.n ?? "—"}</div><div className="text-sm text-muted-foreground">{r.label}</div>
          </div>
        ))}
        {isFetching && !data && <div className="text-sm text-muted-foreground">Loading…</div>}
      </div>
    </div>
  );
}
