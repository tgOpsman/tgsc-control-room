import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/import")({
  head: () => ({ meta: [
    { title: "Import Base44 Data — Control Room Manager" },
    { name: "description", content: "Upload CSV exports from Base44 into the matching log." },
    { property: "og:title", content: "Import Base44 Data — Control Room Manager" },
    { property: "og:description", content: "Upload CSV exports from Base44 into the matching log." },
  ] }),
  component: Page,
});

// Base44 entity name -> table here
const TARGETS: [string, string][] = [
  ["VehicleVisit", "vehicle_visits"], ["CheckInRecord", "check_in_records"], ["Tenant", "tenants"], ["OutOfHoursContact", "out_of_hours_contacts"],
  ["KeyInventory", "key_inventory"], ["KeyLog", "key_logs"], ["KeyAudit", "key_audits"], ["AssetInventory", "asset_inventory"], ["AssetLog", "asset_logs"],
  ["CarParkPatrol", "car_park_patrols"], ["BarrierRaiseLog", "barrier_raise_logs"], ["CCTV logs (all tabs)", "cctv_logs"], ["Fire logs (all tabs)", "fire_logs"],
  ["ContractorInventory", "contractor_inventory"], ["ContractorCalloutLog", "contractor_callouts"], ["WeatherLog", "weather_logs"], ["SpillageLog", "spillage_logs"],
  ["RadonTest", "radon_tests"], ["DefectReport", "defect_reports"], ["HandoverReport", "handover_reports"], ["FoundProperty / LostProperty", "found_properties"],
  ["VacantUnitCheck", "vacant_unit_checks"], ["CTIncident", "ct_incidents"], ["BombThreatReport", "bomb_threats"], ["TeamMember", "team_members"],
  ["TrainingRecord", "training_records"], ["EvacuationEvent", "evacuation_events"], ["MusterRecord", "muster_records"],
];

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ""));
}

const SKIP = new Set(["id", "created_date", "updated_date", "created_by", "created_by_id", "is_sample", "control_room_id"]);

function Page() {
  const [table, setTable] = useState("vehicle_visits");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const run = async (file: File) => {
    setBusy(true); setLog([]);
    const rows = parseCsv(await file.text());
    const [head = [], ...body] = rows;
    // find real columns by probing an empty select
    const probe = await db(table).select("*").limit(1);
    const known = probe.data?.[0] ? Object.keys(probe.data[0]) : null;
    const records = body.map((r) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec: any = { extra: {} };
      head.forEach((h, i) => {
        const k = h.trim(); const v = r[i];
        if (k === "id") { rec.legacy_id = v; return; }
        if (k === "created_date" && v) { rec.created_at = v; return; }
        if (SKIP.has(k) || v === "" || v == null) return;
        let val: any = v;
        if (v === "true" || v === "false") val = v === "true";
        else if (/^[\[{]/.test(v)) { try { val = JSON.parse(v); } catch { /* keep text */ } }
        if (!known || known.includes(k)) rec[k] = val; else rec.extra[k] = val;
      });
      return rec;
    });
    let ok = 0; const errs: string[] = [];
    for (let i = 0; i < records.length; i += 200) {
      const chunk = records.slice(i, i + 200);
      const { error } = await db(table).insert(chunk);
      if (error) {
        // fall back row-by-row, moving unknown columns into extra
        for (const rec of chunk) {
          let r = await db(table).insert(rec);
          if (r.error && /column/.test(r.error.message)) {
            const m = r.error.message.match(/'([^']+)' column/);
            if (m) { rec.extra[m[1]] = rec[m[1]]; delete rec[m[1]]; r = await db(table).insert(rec); }
          }
          if (r.error) errs.push(r.error.message); else ok++;
        }
      } else ok += chunk.length;
    }
    setLog([`Imported ${ok} of ${records.length} rows into ${table}.`, ...Array.from(new Set(errs)).slice(0, 10)]);
    toast.success(`Imported ${ok} rows`);
    setBusy(false);
  };
  return (
    <div className="p-6 md:p-8 max-w-[900px] mx-auto">
      <h1 className="text-3xl font-bold mb-1">Import Base44 Data</h1>
      <p className="text-sm text-muted-foreground mb-6">In Base44 go to Dashboard → Data, pick a table, ⋯ → Export CSV. Upload each file here against the matching log. Original Base44 IDs are kept, and any fields without a matching column are saved alongside the record so nothing is lost.</p>
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <label className="block text-sm font-medium">Base44 table
          <select className="mt-1 block w-full border rounded-md px-3 py-2 bg-card" value={table} onChange={(e) => setTable(e.target.value)}>
            {TARGETS.map(([b, t]) => <option key={t} value={t}>{b} → {t.replace(/_/g, " ")}</option>)}
          </select>
        </label>
        <input type="file" accept=".csv,text/csv" disabled={busy} onChange={(e) => e.target.files?.[0] && run(e.target.files[0])} />
        {busy && <p className="text-sm">Importing…</p>}
        {log.map((l, i) => <p key={i} className={i ? "text-xs text-destructive" : "text-sm font-semibold"}>{l}</p>)}
        <Button variant="outline" size="sm" onClick={() => setLog([])}>Clear</Button>
      </div>
    </div>
  );
}
