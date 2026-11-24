import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertOctagon, Printer, RefreshCw, Upload } from "lucide-react";
import { loadLiveMuster } from "@/lib/live-muster";
import { parseCsv } from "@/lib/csv";
import { musterSummary } from "@/lib/muster";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { db, fmt } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/red-hat")({
  head: () => ({ meta: [
    { title: "RED HAT Evacuation — Control Room Manager" },
    { name: "description", content: "Start an evacuation and run the live muster roll." },
    { property: "og:title", content: "RED HAT Evacuation — Control Room Manager" },
    { property: "og:description", content: "Start an evacuation and run the live muster roll." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: RedHat,
});

function RedHat() {
  const { name } = useAuth();
  const qc = useQueryClient();
  const [loadingLive, setLoadingLive] = useState(false);
  const { data } = useQuery({
    queryKey: ["redhat"],
    queryFn: async () => {
      const ev = (await db("evacuation_events").select("*").order("started_at", { ascending: false }).limit(10)).data ?? [];
      const active = ev.find((e: any) => e.status === "active");
      const muster = active ? (await db("muster_records").select("*").eq("event_id", active.id).order("name")).data ?? [] : [];
      return { active, past: ev.filter((e: any) => e.status !== "active"), muster };
    },
  });
  useEffect(() => {
    const ch = supabase.channel(`muster-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "muster_records" }, () => qc.invalidateQueries({ queryKey: ["redhat"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  const refresh = () => qc.invalidateQueries({ queryKey: ["redhat"] });

  const start = async (drill: boolean) => {
    if (loadingLive) return;
    if (!confirm(drill ? "Start an evacuation DRILL?" : "Start a LIVE evacuation?")) return;
    setLoadingLive(true);
    try {
    const { data: ev, error } = await db("evacuation_events").insert({ is_drill: drill, started_by: name }).select().single();
    if (error) throw error;
    const counts = await loadLiveMuster(ev, true);
    toast.success(`Evacuation started — ${counts.occupiers} occupiers and ${counts.people} people loaded`);
    } catch { toast.error("Unable to load the live roll. Use Load live occupiers & people to retry."); }
    finally { setLoadingLive(false); refresh(); }
  };
  const loadLive = async () => {
    if (!data?.active || loadingLive) return;
    setLoadingLive(true);
    try {
      const counts = await loadLiveMuster(data.active);
      toast.success(counts.occupiers || counts.people ? `${counts.occupiers} occupiers and ${counts.people} people added` : "All current occupiers and people are already on the roll");
      await refresh();
    } catch { toast.error("Unable to load live occupiers and people. Please try again."); }
    finally { setLoadingLive(false); }
  };
  const setStatus = async (id: string, status: string, extra?: object, people?: number) => {
    const patch: any = { status, checked_at: new Date().toISOString() };
    if (extra) patch.extra = extra;
    if (people != null) patch.people = people;
    const { error } = await db("muster_records").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    refresh();
  };
  const [checking, setChecking] = useState<any>(null);
  const [bulk, setBulk] = useState(false);
  const [viewPast, setViewPast] = useState<any>(null);
  const [add, setAdd] = useState("");
  const addPerson = async () => {
    if (!add.trim() || !data?.active) return;
    await db("muster_records").insert({ event_id: data.active.id, name: add.trim(), status: "pending", extra: { category: "Visitor" } });
    setAdd(""); refresh();
  };
  const end = async () => {
    if (!data?.active || loadingLive) return;
    if (!confirm("End this evacuation?")) return;
    await db("evacuation_events").update({ status: "ended", ended_at: new Date().toISOString(), extra: { ...(data.active.extra ?? {}), summary: musterSummary(m), ended_by: name } }).eq("id", data.active.id);
    refresh();
  };
  const m = data?.muster ?? [];
  const sum = musterSummary(m);
  const [filter, setFilter] = useState("all");
  const shown = m.filter((x: any) => filter === "all" || (x.extra?.category ?? "Visitor") === filter || x.status === filter);

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      <h1 className="text-3xl font-bold flex items-center gap-3"><AlertOctagon className="text-destructive" /> RED HAT — Evacuation & Muster</h1>
      {!data?.active ? (
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <Button disabled={loadingLive} onClick={() => start(false)} variant="destructive" className="h-auto whitespace-normal p-8 text-2xl font-bold">START LIVE EVACUATION</Button>
          <Button disabled={loadingLive} onClick={() => start(true)} variant="outline" className="h-auto p-8 text-xl font-semibold border-dashed">Start drill</Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-destructive text-destructive-foreground p-5 flex flex-wrap justify-between items-center gap-3">
            <div><div className="text-xl font-bold">{data.active.is_drill ? "DRILL" : "LIVE EVACUATION"} in progress</div><div className="text-sm opacity-90">Started {fmt(data.active.started_at)} by {data.active.started_by}</div></div>
            <div className="text-3xl font-mono font-bold">{sum.accounted} accounted · {sum.missing} missing · {sum.pending} pending</div>
            <div className="flex gap-2 print:hidden"><Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Report</Button><Button variant="secondary" disabled={loadingLive} onClick={end}>End evacuation</Button></div>
          </div>
          {sum.partial > 0 && <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm font-medium">{sum.partial} team(s) accounted with fewer people than expected — check with store managers.</div>}
          <div className="flex flex-wrap gap-2 print:hidden">
            <Input className="flex-1 min-w-52" placeholder="Add person / occupier" value={add} onChange={(e) => setAdd(e.target.value)} /><Button onClick={addPerson}>Add</Button>
            <Button variant="outline" disabled={loadingLive} onClick={loadLive}><RefreshCw className={`h-4 w-4 ${loadingLive ? "animate-spin motion-reduce:animate-none" : ""}`} />{loadingLive ? "Loading…" : "Load live occupiers & people"}</Button>
            <Button variant="outline" onClick={() => setBulk(true)}><Upload className="h-4 w-4" /> Import CSV</Button>
          </div>
          <div className="flex flex-wrap gap-1 print:hidden">
            {["all", "Occupier", "Visitor", "Staff", "Contractor", "Agency", "Vehicle", "pending", "missing"].map((f) => <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">{f}</Button>)}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shown.map((x: any) => (
              <div key={x.id} className={`rounded-lg border p-3 ${x.status === "accounted" ? "bg-success/10 border-success/40" : x.status === "missing" ? "bg-destructive/10 border-destructive/40" : "bg-card"}`}>
                <div className="font-semibold break-words">{x.name}</div>
                <div className="text-xs text-muted-foreground">{[x.extra?.category, x.company, x.ref, x.extra?.phone].filter(Boolean).join(" · ")}</div>
                <div className="text-xs mt-1">{x.status === "accounted" ? `${x.people}${x.extra?.expected ? ` of ${x.extra.expected}` : ""} accounted${x.extra?.checked_by ? ` · by ${x.extra.checked_by}` : ""}` : x.extra?.expected ? `Expected ${x.extra.expected}` : x.extra?.headcount_unknown ? "Headcount not recorded" : ""}{x.notes ? ` · ${x.notes}` : ""}</div>
                <div className="flex gap-1 mt-2 print:hidden">
                  <Button size="sm" variant={x.status === "accounted" ? "default" : "outline"} onClick={() => setChecking(x)}>Accounted</Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(x.id, "missing")}>Missing</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {!!data?.past.length && (
        <div className="mt-10"><h2 className="font-semibold mb-2">Past evacuations</h2>
          {data.past.map((e: any) => <button key={e.id} onClick={() => setViewPast(e)} className="w-full text-left text-sm border-b py-2 hover:bg-muted/40">{fmt(e.started_at)} → {fmt(e.ended_at)} · {e.is_drill ? "Drill" : "Live"} · {e.started_by}{e.extra?.summary ? ` · ${e.extra.summary.accounted} accounted, ${e.extra.summary.missing} missing` : ""}</button>)}
        </div>
      )}
      {checking && <CheckoffDialog row={checking} by={name} onClose={() => setChecking(null)} onSave={(people, notes) => { setStatus(checking.id, "accounted", { ...(checking.extra ?? {}), checked_by: name }, people); if (notes) db("muster_records").update({ notes }).eq("id", checking.id).then(refresh); setChecking(null); }} />}
      {bulk && data?.active && <BulkLoad eventId={data.active.id} onClose={() => { setBulk(false); refresh(); }} />}
      {viewPast && <PastReport ev={viewPast} onClose={() => setViewPast(null)} />}
    </div>
  );
}

function CheckoffDialog({ row, by, onClose, onSave }: { row: any; by: string; onClose: () => void; onSave: (people: number, notes: string) => void }) {
  const [people, setPeople] = useState(String(row.extra?.expected ?? row.people ?? 1));
  const [notes, setNotes] = useState(row.notes ?? "");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Account for {row.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>People accounted for{row.extra?.expected ? ` (expected ${row.extra.expected})` : ""}</Label><Input type="number" min={0} value={people} onChange={(e) => setPeople(e.target.value)} /></div>
          <div><Label>Notes / where they are</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">Recorded by {by}</p>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(Number(people) || 0, notes)}>Confirm accounted</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkLoad({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const template = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["Name,Unit,Expected People,Contact Phone\nExample Store,U12,4,07700 900000\n"], { type: "text/csv" }));
    a.download = "occupier-template.csv"; a.click();
  };
  const load = async () => {
    setBusy(true);
    const ins = rows.filter((r) => r.name).map((r) => ({ event_id: eventId, name: r.name, company: r.unit || null, status: "pending", people: Number(r.expected_people) || 1, extra: { category: "Occupier", expected: Number(r.expected_people) || null, phone: r.contact_phone || null } }));
    const { error } = await db("muster_records").insert(ins);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ins.length} occupiers loaded`); onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Load occupiers from a spreadsheet</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Save your occupier list as CSV with columns: Name, Unit, Expected People, Contact Phone.</p>
        <Button variant="link" className="px-0 w-fit" onClick={template}>Download template</Button>
        <Input type="file" accept=".csv,text/csv" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setRows(parseCsv(await f.text())); }} />
        {!!rows.length && <p className="text-sm">{rows.filter((r) => r.name).length} occupiers ready to load.</p>}
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!rows.length || busy} onClick={load}>Load</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PastReport({ ev, onClose }: { ev: any; onClose: () => void }) {
  const { data = [] } = useQuery({ queryKey: ["muster", ev.id], queryFn: async () => (await db("muster_records").select("*").eq("event_id", ev.id).order("name")).data ?? [] });
  const s = musterSummary(data);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{ev.is_drill ? "Drill" : "Evacuation"} report — {fmt(ev.started_at)}</DialogTitle></DialogHeader>
        <div className="text-sm">Started by {ev.started_by} · ended {fmt(ev.ended_at)} · <b>{s.accounted} accounted, {s.missing} missing, {s.pending} not checked</b></div>
        <table className="w-full text-sm"><tbody>
          {data.map((x: any) => <tr key={x.id} className="border-t"><td className="py-1">{x.name}</td><td>{x.extra?.category}</td><td>{x.company}</td><td className="capitalize font-medium">{x.status}</td><td>{x.people}</td></tr>)}
        </tbody></table>
        <Button variant="outline" className="print:hidden w-fit" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
      </DialogContent>
    </Dialog>
  );
}
