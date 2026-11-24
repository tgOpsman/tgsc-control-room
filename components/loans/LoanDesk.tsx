import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { db, fmt } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { keyMismatch, returnProblem } from "@/lib/loans";
import { ModulePage } from "@/components/app/ModulePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
export type Kind = "keys" | "equipment";
const CFG = {
  keys: { title: "Keys & Passes", log: "key_logs", inv: "key_inventory", fk: "key_id", label: "item_label", invPath: "/keys/inventory", histPath: "/keys", auditPath: "/keys/audit" },
  equipment: { title: "Radios, Bodycams & Phones", log: "asset_logs", inv: "asset_inventory", fk: "asset_id", label: "asset_label", invPath: "/equipment/inventory", histPath: "/equipment", auditPath: null },
} as const;
const COLOUR: Record<string, string> = { Black: "bg-foreground text-background", Green: "bg-success text-success-foreground", Orange: "bg-accent text-accent-foreground", Red: "bg-destructive text-destructive-foreground", "Blue/Purple": "bg-primary text-primary-foreground" };
export const invLabel = (k: Kind, r: Row) => k === "keys"
  ? `${r.item_type === "Access Pass" ? `Pass ${r.pass_number ?? ""}` : `Key ${r.key_number ?? ""}`}${r.description ? ` — ${r.description}` : ""}`
  : `${r.asset_type} ${r.asset_number ?? ""}`.trim();

export function LoanDesk({ kind, kiosk = false }: { kind: Kind; kiosk?: boolean }) {
  const c = CFG[kind];
  const qc = useQueryClient();
  const { name } = useAuth();
  const [tab, setTab] = useState<"live" | "history">("live");
  const { data } = useQuery({
    queryKey: ["loans", kind], refetchInterval: 30000,
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [inv, out, issued] = await Promise.all([
        db(c.inv).select("*").eq("is_active", true),
        db(c.log).select("*").eq("status", "out").order("issued_at", { ascending: false }),
        db(c.log).select("id", { count: "exact", head: true }).gte("issued_at", today.toISOString()),
      ]);
      return { inv: (inv.data ?? []) as Row[], out: (out.data ?? []) as Row[], today: issued.count ?? 0 };
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["loans", kind] }); qc.invalidateQueries({ queryKey: ["mod"] }); };
  const inv = data?.inv ?? [];
  const out = data?.out ?? [];
  const outIds = new Set(out.map((o) => o[c.fk]).filter(Boolean));
  const available = inv.filter((i) => !outIds.has(i.id) && (kind === "keys" || i.status !== "faulty"));

  const [item, setItem] = useState("");
  const [to, setTo] = useState("");
  const [company, setCompany] = useState("");
  const [count, setCount] = useState("");
  const [q, setQ] = useState("");
  const [returning, setReturning] = useState<Row | null>(null);

  const checkout = async () => {
    const it = inv.find((i) => i.id === item);
    if (!it || !to.trim()) { toast.error("Choose an item and who it's issued to"); return; }
    const row: Row = { [c.fk]: it.id, [c.label]: invLabel(kind, it), issued_to: to, status: "out", issued_at: new Date().toISOString(), extra: { issued_by: name, kiosk } };
    if (kind === "keys") { row.company = company || null; row.keys_out = count ? Number(count) : it.total_keys_on_bunch ?? null; }
    const { error } = await db(c.log).insert(row);
    if (error) { toast.error(error.message); return; }
    if (kind === "equipment") await db(c.inv).update({ status: "out" }).eq("id", it.id);
    toast.success(`${invLabel(kind, it)} issued to ${to}`);
    setItem(""); setTo(""); setCompany(""); setCount(""); refresh();
  };

  const [bulk, setBulk] = useState<Set<string>>(new Set());
  const [bulkOut, setBulkOut] = useState(false);
  const toggle = (id: string) => setBulk((b) => { const n = new Set(b); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const bulkReturn = async () => {
    const rows = out.filter((o) => bulk.has(o.id));
    const now = new Date().toISOString();
    for (const o of rows) {
      const patch: Row = { status: "returned", returned_at: now };
      if (kind === "keys") patch.keys_returned = o.keys_out ?? null; else patch.in_order = true;
      const { error } = await db(c.log).update(patch).eq("id", o.id);
      if (error) { toast.error(error.message); return; }
      if (kind === "equipment" && o[c.fk]) await db(c.inv).update({ status: "available" }).eq("id", o[c.fk]);
    }
    toast.success(`${rows.length} returned in order`); setBulk(new Set()); refresh();
  };
  const shown = useMemo(() => out.filter((o) => !q || JSON.stringify(o).toLowerCase().includes(q.toLowerCase())), [out, q]);
  const invById = (id: string) => inv.find((i) => i.id === id);
  const hours = (d: string) => (Date.now() - new Date(d).getTime()) / 3.6e6;

  return (
    <div className={kiosk ? "" : "p-6 md:p-8 max-w-[1500px] mx-auto"}>
      {!kiosk && (
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{c.title}</h1>
          <div className="flex gap-2">
            <Button variant={tab === "live" ? "default" : "outline"} size="sm" onClick={() => setTab("live")}>Live</Button>
            <Button variant={tab === "history" ? "default" : "outline"} size="sm" onClick={() => setTab("history")}>History</Button>
            <Button variant="outline" size="sm" asChild><Link to={c.invPath as "/"}>Inventory</Link></Button>
            {c.auditPath && <Button variant="outline" size="sm" asChild><Link to={c.auditPath as "/"}>Cabinet audits</Link></Button>}
          </div>
        </div>
      )}
      {tab === "history" && !kiosk ? <div className="-mx-6 md:-mx-8"><ModulePage path={c.histPath} /></div> : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[["Currently out", out.length], ["Issued today", data?.today ?? 0], ["In inventory", inv.length]].map(([l, n]) => (
              <div key={l as string} className="bg-primary text-primary-foreground rounded-xl p-4"><div className="text-3xl font-bold font-mono">{n}</div><div className="text-sm opacity-80">{l}</div></div>
            ))}
          </div>
          <div className="grid lg:grid-cols-[380px_1fr] gap-5">
            <div className="bg-card border rounded-xl p-4 space-y-3 h-fit">
              <h2 className="font-semibold">Sign out</h2>
              <div><Label>Item</Label>
                <Select value={item} onValueChange={setItem}>
                  <SelectTrigger><SelectValue placeholder={available.length ? "Choose…" : "Nothing available — add to inventory"} /></SelectTrigger>
                  <SelectContent>{available.map((i) => <SelectItem key={i.id} value={i.id}>{kind === "keys" && i.key_press_colour ? `[${i.key_press_colour}] ` : ""}{invLabel(kind, i)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Issued to</Label><Input value={to} onChange={(e) => setTo(e.target.value)} /></div>
              {kind === "keys" && <>
                <div><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
                <div><Label>Keys on bunch</Label><Input type="number" value={count || (invById(item)?.total_keys_on_bunch ?? "")} onChange={(e) => setCount(e.target.value)} /></div>
              </>}
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={checkout}>Sign out</Button>
              <Button variant="outline" className="w-full" onClick={() => setBulkOut(true)}>Bulk sign out…</Button>
            </div>
            <div>
              <div className="relative mb-3"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search who has what…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
              {bulk.size > 0 && <div className="flex items-center justify-between bg-muted rounded-lg p-2 mb-3 text-sm"><span>{bulk.size} selected</span><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setBulk(new Set())}>Clear</Button><Button size="sm" onClick={bulkReturn}>Return selected (in order)</Button></div></div>}
              <div className="grid sm:grid-cols-2 gap-3">
                {shown.map((o) => {
                  const it = invById(o[c.fk]);
                  const overdue = hours(o.issued_at) >= 24;
                  return (
                    <div key={o.id} className={`bg-card border rounded-xl p-3 ${overdue ? "border-destructive/60" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex gap-2">
                          <input type="checkbox" aria-label="Select for bulk return" className="mt-1 h-4 w-4" checked={bulk.has(o.id)} onChange={() => toggle(o.id)} />
                          <div>
                          <div className="font-semibold">{o[c.label]}</div>
                          <div className="text-sm">{o.issued_to}{o.company ? ` · ${o.company}` : ""}</div>
                          <div className="text-xs text-muted-foreground">Out since {fmt(o.issued_at)}{o.keys_out ? ` · ${o.keys_out} keys` : ""}</div>
                          </div>
                        </div>
                        {it?.key_press_colour && <Badge className={COLOUR[it.key_press_colour] ?? ""}>{it.key_press_colour}</Badge>}
                      </div>
                      {overdue && <div className="text-xs text-destructive font-semibold mt-1">Out over 24 hours</div>}
                      <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => setReturning(o)}>Return</Button>
                    </div>
                  );
                })}
                {!shown.length && <div className="text-sm text-muted-foreground p-6 text-center col-span-full bg-card border rounded-xl">Nothing signed out.</div>}
              </div>
            </div>
          </div>
        </>
      )}
      {bulkOut && <BulkOutDialog kind={kind} items={available} kiosk={kiosk} issuer={name} onClose={() => setBulkOut(false)} onDone={() => { setBulkOut(false); refresh(); }} />}
      {returning && <ReturnDialog kind={kind} row={returning} onClose={() => setReturning(null)} onDone={() => { setReturning(null); refresh(); }} />}
    </div>
  );
}

function ReturnDialog({ kind, row, onClose, onDone }: { kind: Kind; row: Row; onClose: () => void; onDone: () => void }) {
  const c = CFG[kind];
  const [back, setBack] = useState(String(row.keys_out ?? ""));
  const [ok, setOk] = useState(true);
  const [notes, setNotes] = useState("");
  const mismatch = kind === "keys" && keyMismatch(row.keys_out, back === "" ? null : Number(back));
  const save = async () => {
    if (kind === "equipment") { const p = returnProblem(ok, notes); if (p) { toast.error(p); return; } }
    if (mismatch && !notes.trim()) { toast.error("Explain the key count mismatch"); return; }
    const patch: Row = { status: "returned", returned_at: new Date().toISOString(), notes: notes || row.notes || null };
    if (kind === "keys") { patch.keys_returned = back === "" ? null : Number(back); patch.count_mismatch = mismatch; }
    else patch.in_order = ok;
    const { error } = await db(c.log).update(patch).eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    if (kind === "equipment" && row.asset_id) await db(c.inv).update({ status: ok ? "available" : "faulty" }).eq("id", row.asset_id);
    toast.success("Returned"); onDone();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Return {row[c.label]}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {kind === "keys" ? (
            <div><Label>Keys returned{row.keys_out ? ` (issued ${row.keys_out})` : ""}</Label><Input type="number" value={back} onChange={(e) => setBack(e.target.value)} />
              {mismatch && <p className="text-sm text-destructive font-medium mt-1">Count doesn't match — this will be flagged.</p>}</div>
          ) : (
            <Label className="flex items-center gap-3"><Switch checked={ok} onCheckedChange={setOk} /> Is the equipment in order?</Label>
          )}
          <div><Label>{kind === "equipment" && !ok ? "Fault notes (required)" : "Notes"}</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Confirm return</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkOutDialog({ kind, items, kiosk, issuer, onClose, onDone }: { kind: Kind; items: Row[]; kiosk: boolean; issuer: string; onClose: () => void; onDone: () => void }) {
  const c = CFG[kind];
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!sel.size || !to.trim()) { toast.error("Pick items and who they're issued to"); return; }
    setBusy(true);
    const now = new Date().toISOString();
    const picked = items.filter((i) => sel.has(i.id));
    const rows = picked.map((it) => ({ [c.fk]: it.id, [c.label]: invLabel(kind, it), issued_to: to, status: "out", issued_at: now, ...(kind === "keys" ? { keys_out: it.total_keys_on_bunch ?? null } : {}), extra: { issued_by: issuer, kiosk, bulk: true } }));
    const { error } = await db(c.log).insert(rows);
    if (!error && kind === "equipment") await db(c.inv).update({ status: "out" }).in("id", picked.map((i) => i.id));
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} items issued to ${to}`); onDone();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Bulk sign out</DialogTitle></DialogHeader>
        <div><Label>Issued to</Label><Input value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="flex justify-between text-sm"><span>{sel.size} of {items.length} selected</span><button type="button" className="underline" onClick={() => setSel(sel.size === items.length ? new Set() : new Set(items.map((i) => i.id)))}>{sel.size === items.length ? "Clear" : "Select all"}</button></div>
        <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
          {items.map((i) => (
            <label key={i.id} className="flex items-center gap-2 p-2 text-sm cursor-pointer">
              <input type="checkbox" className="h-4 w-4" checked={sel.has(i.id)} onChange={() => setSel((s) => { const n = new Set(s); if (n.has(i.id)) n.delete(i.id); else n.add(i.id); return n; })} />
              {invLabel(kind, i)}
            </label>
          ))}
          {!items.length && <div className="p-4 text-sm text-muted-foreground text-center">Nothing available.</div>}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy} onClick={save}>{busy ? "Saving…" : `Sign out ${sel.size}`}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
