import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { db, fmt } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { dailyRef } from "@/lib/refs";
import { frequentVisitors } from "@/lib/overdue";
import { uploadFile } from "@/lib/files";
import { insertOrQueue } from "@/lib/offline-queue";
import { QrPosterButton } from "@/components/checkin/QrPoster";
import { ModulePage } from "@/components/app/ModulePage";
import { PhotoField } from "@/components/app/PhotoField";
import { SignaturePad } from "@/components/app/SignaturePad";
import { TenantAutocomplete } from "@/components/app/TenantAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
const TYPES = ["Visitor", "Contractor", "Staff", "Agency"];
export const SAFETY_QS = [
  { key: "work_complete", label: "Is the work complete, or the area left safe?" },
  { key: "hot_works_closed", label: "Hot works permit closed (if issued)?" },
  { key: "area_clean", label: "Work area cleaned and waste removed?" },
  { key: "isolations_restored", label: "All isolations removed / systems restored?" },
  { key: "defects_reported", label: "Any defects found reported to control?" },
];

export function SiteCheckInPage() {
  const qc = useQueryClient();
  const { name } = useAuth();
  const [tab, setTab] = useState<"live" | "history">("live");
  const empty = { visit_type: "Visitor", full_name: "", company: "", destination: "", badge_number: "", access_reason: "", photo: "", rams: false, permit: false, hot_work: false, permit_number: "" };
  const [v, setV] = useState(empty);
  const set = (k: string, x: unknown) => setV((s) => ({ ...s, [k]: x }));
  const [out, setOut] = useState<Row | null>(null);
  const { data: active = [] } = useQuery({
    queryKey: ["onsite"], refetchInterval: 30000,
    queryFn: async () => (await db("check_in_records").select("*").eq("status", "active").neq("visit_type", "RoofAccess").order("check_in_time", { ascending: false })).data as Row[],
  });
  const { data: regulars = [] } = useQuery({
    queryKey: ["regulars"], staleTime: 300000,
    queryFn: async () => frequentVisitors(((await db("check_in_records").select("full_name,company,visit_type,destination").neq("visit_type", "RoofAccess").gte("check_in_time", new Date(Date.now() - 90 * 864e5).toISOString()).limit(1000)).data ?? []) as Row[]),
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["onsite"] }); qc.invalidateQueries({ queryKey: ["mod"] }); };

  const checkIn = async () => {
    if (!v.full_name.trim()) { toast.error("Enter a name"); return; }
    const d = new Date(); d.setHours(0, 0, 0, 0);
    const { count } = navigator.onLine ? await db("check_in_records").select("id", { count: "exact", head: true }).gte("check_in_time", d.toISOString()).then((r: { count: number | null }) => r, () => ({ count: null })) : { count: null };
    const booking_ref = count == null ? `OFF-${Date.now().toString(36).toUpperCase()}` : dailyRef("", new Date(), count);
    const { error, queued } = await insertOrQueue("check_in_records", {
      visit_type: v.visit_type, full_name: v.full_name, company: v.company || null, destination: v.destination || null,
      badge_number: v.badge_number || null, access_reason: v.access_reason || null, status: "active", booking_ref, check_in_time: new Date().toISOString(),
      extra: { photo: v.photo || null, checked_in_by: name, ...(v.visit_type === "Contractor" ? { rams: v.rams, permit: v.permit, hot_work: v.hot_work, permit_number: v.permit_number || null } : {}) },
    });
    if (error) { toast.error(error.message); return; }
    toast.success(queued ? `${v.full_name} saved offline — will upload when the internet is back` : `${v.full_name} checked in · ${booking_ref}`);
    setV(empty); refresh();
  };
  const quickOut = async (r: Row) => {
    if (r.visit_type === "Contractor") { setOut(r); return; }
    await db("check_in_records").update({ status: "completed", check_out_time: new Date().toISOString() }).eq("id", r.id);
    toast.success(`${r.full_name} checked out`); refresh();
  };

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight">Person Check In/Out</h1><p className="text-sm text-muted-foreground">{active.length} on site now</p></div>
        <div className="flex gap-2">
          <QrPosterButton />
          <Button size="sm" variant={tab === "live" ? "default" : "outline"} onClick={() => setTab("live")}>On site</Button>
          <Button size="sm" variant={tab === "history" ? "default" : "outline"} onClick={() => setTab("history")}>History</Button>
        </div>
      </div>
      {tab === "history" ? <div className="-mx-6 md:-mx-8"><ModulePage path="/site-checkin" /></div> : (
        <div className="grid lg:grid-cols-[400px_1fr] gap-5">
          <div className="bg-card border rounded-xl p-4 space-y-3 h-fit">
            <div className="grid grid-cols-4 gap-1">{TYPES.map((t) => <Button key={t} size="sm" variant={v.visit_type === t ? "default" : "outline"} onClick={() => set("visit_type", t)}>{t}</Button>)}</div>
            {regulars.length > 0 && <div><Label className="text-xs text-muted-foreground">Regular visitors</Label><div className="flex flex-wrap gap-1 mt-1">{regulars.map(({ row, n }) => (
              <Button key={row.full_name + row.company} type="button" size="sm" variant="secondary" className="h-7 text-xs" onClick={() => setV((s) => ({ ...s, visit_type: row.visit_type || s.visit_type, full_name: row.full_name, company: row.company ?? "", destination: row.destination ?? "" }))}>{row.full_name}{row.company ? ` · ${row.company}` : ""} ({n})</Button>
            ))}</div></div>}
            <div><Label>Full name *</Label><Input value={v.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
            <div><Label>Company</Label><Input value={v.company} onChange={(e) => set("company", e.target.value)} /></div>
            <div><Label>Visiting / destination</Label><TenantAutocomplete value={v.destination} onChange={(x) => set("destination", x)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Badge no.</Label><Input value={v.badge_number} onChange={(e) => set("badge_number", e.target.value)} /></div>
              <div><Label>Reason</Label><Input value={v.access_reason} onChange={(e) => set("access_reason", e.target.value)} /></div>
            </div>
            {v.visit_type === "Contractor" && (
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                <div className="text-sm font-semibold">Contractor safety</div>
                {[["rams", "RAMS received & checked"], ["permit", "JLL work permit issued"], ["hot_work", "Hot works involved"]].map(([k, l]) => (
                  <Label key={k} className="flex items-center gap-2 font-normal"><Switch checked={!!(v as Row)[k!]} onCheckedChange={(c) => set(k!, c)} /> {l}</Label>
                ))}
                {v.permit && <Input placeholder="Permit number" value={v.permit_number} onChange={(e) => set("permit_number", e.target.value)} />}
              </div>
            )}
            <div><Label>Photo</Label><PhotoField value={v.photo} onChange={(x) => set("photo", x)} folder="checkins" /></div>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={checkIn}>Check in</Button>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 content-start">
            {active.map((r) => (
              <div key={r.id} className="bg-card border rounded-xl p-3">
                <div className="flex justify-between gap-2"><div className="font-semibold">{r.full_name}</div><div className="flex gap-1">{r.extra?.source === "qr" && <Badge className="bg-accent text-accent-foreground">QR</Badge>}<Badge variant="outline">{r.visit_type}</Badge></div></div>
                <div className="text-sm text-muted-foreground">{[r.company, r.destination].filter(Boolean).join(" → ")}</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">{r.booking_ref} · in {fmt(r.check_in_time)}{r.badge_number ? ` · badge ${r.badge_number}` : ""}{r.extra?.phone ? ` · ${r.extra.phone}` : ""}</div>
                {r.visit_type === "Contractor" && <div className="flex gap-1 mt-1 flex-wrap">
                  {r.extra?.rams ? <Badge variant="outline" className="text-success border-success/40">RAMS</Badge> : <Badge variant="outline" className="text-destructive border-destructive/40">No RAMS</Badge>}
                  {r.extra?.permit && <Badge variant="outline">Permit {r.extra.permit_number ?? ""}</Badge>}
                  {r.extra?.hot_work && <Badge className="bg-accent text-accent-foreground">Hot works</Badge>}
                </div>}
                <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => quickOut(r)}>Check out</Button>
              </div>
            ))}
            {!active.length && <div className="col-span-full bg-card border rounded-xl p-8 text-center text-sm text-muted-foreground">Nobody checked in.</div>}
          </div>
        </div>
      )}
      {out && <ContractorCheckOut row={out} onClose={() => setOut(null)} onDone={() => { setOut(null); refresh(); }} />}
    </div>
  );
}

function ContractorCheckOut({ row, onClose, onDone }: { row: Row; onClose: () => void; onDone: () => void }) {
  const [ans, setAns] = useState<Record<string, string>>({});
  const [sig, setSig] = useState<Blob | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (SAFETY_QS.some((q) => !ans[q.key])) { toast.error("Answer every safety question"); return; }
    if (!sig) { toast.error("The contractor must sign"); return; }
    setBusy(true);
    try {
      const signature = await uploadFile(sig, "signatures", "png");
      const { error } = await db("check_in_records").update({ status: "completed", check_out_time: new Date().toISOString(), extra: { ...(row.extra ?? {}), checkout: { answers: ans, notes, signature, signed_at: new Date().toISOString() } } }).eq("id", row.id);
      if (error) throw error;
      toast.success(`${row.full_name} signed out`); onDone();
    } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Contractor sign-out — {row.full_name}</DialogTitle></DialogHeader>
        {SAFETY_QS.map((q) => (
          <div key={q.key} className="flex items-center justify-between gap-2 border-b py-2 text-sm">
            <span>{q.label}</span>
            <div className="flex gap-1">{["Yes", "No", "N/A"].map((o) => <Button key={o} type="button" size="sm" variant={ans[q.key] === o ? "default" : "outline"} onClick={() => setAns((a) => ({ ...a, [q.key]: o }))}>{o}</Button>)}</div>
          </div>
        ))}
        <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <div><Label>Contractor signature *</Label><SignaturePad onChange={setSig} /></div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy} onClick={save}>{busy ? "Saving…" : "Sign out"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
