import { insertOrQueue } from "@/lib/offline-queue";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Download, Pencil, Phone, Plus, Printer, RefreshCw, Search, Trash2 } from "lucide-react";
import { moduleByPath, radonStatus, type Field } from "@/lib/modules";
import { sortTenants } from "@/lib/tenant-sort";
import { dailyRef, stampRef, yearRef } from "@/lib/refs";
import { db, downloadCsv, fmt, nowLocal, toLocalInput } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TenantAutocomplete } from "@/components/app/TenantAutocomplete";
import { TenantContacts } from "@/components/app/TenantContacts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PhotoField } from "@/components/app/PhotoField";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const STATUS_TONE: Record<string, string> = {
  active: "bg-accent/15 text-accent border-accent/30", out: "bg-accent/15 text-accent border-accent/30",
  open: "bg-warning/20 text-warning-foreground border-warning/40", issues_outstanding: "bg-warning/20 text-warning-foreground border-warning/40",
  target_exceeded: "bg-warning/20 text-warning-foreground border-warning/40", monitoring: "bg-warning/20 text-warning-foreground border-warning/40",
  action_level_exceeded: "bg-destructive/15 text-destructive border-destructive/30", unaccounted: "bg-destructive/15 text-destructive border-destructive/30",
};
const tone = (v: string) => STATUS_TONE[v] ?? "bg-success/15 text-success border-success/30";

export function ModulePage({ path }: { path: string }) {
  const mod = moduleByPath(path);
  const { role } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState(mod.tabs?.[0]?.key);
  const t = mod.tabs?.find((x) => x.key === tab);
  const fields: Field[] = t?.fields ?? mod.fields ?? [];
  const filter = t?.filter ?? {};
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [descending, setDescending] = useState(false);
  const isTenants = mod.table === "tenants";
  const [editing, setEditing] = useState<Row | null>(null);
  const [contactTenant, setContactTenant] = useState<Row | null>(null);
  useEffect(() => {
    const u = new URL(window.location.href);
    if (u.searchParams.get("new")) { setEditing({}); u.searchParams.delete("new"); window.history.replaceState(null, "", u.toString()); }
  }, []);
  const canDelete = role === "admin" || role === "manager";
  const lookup = fields.some((f) => f.key === "contractor_id") ? "contractor" : fields.some((f) => f.key === "member_id") ? "member" : null;
  const needsMembers = !!lookup;

  const key = ["mod", mod.table, JSON.stringify(filter)];
  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: key,
    queryFn: async () => {
      let qy = db(mod.table).select("*").order(mod.sort, { ascending: false }).limit(1000);
      for (const [k, v] of Object.entries(filter)) qy = qy.eq(k, v);
      const { data, error } = await qy;
      if (error) throw error;
      return data as Row[];
    },
  });
  const { data: members = [] } = useQuery({
    queryKey: ["lookup", lookup], enabled: needsMembers,
    queryFn: async () => lookup === "contractor"
      ? (await db("contractor_inventory").select("id,name:company").order("company")).data as Row[]
      : (await db("team_members").select("id,name").order("name")).data as Row[],
  });
  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? "—";

  const get = (r: Row, f: Field) => (f.json ? r[f.json]?.[f.key] : r[f.key]);
  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (s && !JSON.stringify(r).toLowerCase().includes(s)) return false;
      const d = r[mod.sort];
      if (from && d && String(d) < from) return false;
      if (to && d && String(d).slice(0, 10) > to) return false;
      return true;
    });
    return isTenants ? sortTenants(filtered, sortBy, descending) : filtered;
  }, [rows, q, from, to, mod.sort, isTenants, sortBy, descending]);
  const cols = fields.filter((f) => f.list);

  const remove = async (r: Row) => {
    if (!confirm("Delete this record? The deletion is kept in the audit trail.")) return;
    const { error } = await db(mod.table).delete().eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: key });
  };
  const close = async (r: Row) => {
    if (!mod.close) return;
    const { error } = await db(mod.table).update({ ...mod.close.set, [mod.close.timeField]: new Date().toISOString() }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: key });
  };
  const isOpen = (r: Row) => mod.close && Object.entries(mod.close.when).every(([k, v]) => r[k] === v);

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{mod.title}</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-3xl">{mod.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          <Button variant="outline" size="sm" onClick={() => downloadCsv(mod.table, visible)}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New entry</Button>
        </div>
      </div>

      {mod.tabs && mod.tabs.length > 1 && (
        <div className="flex flex-wrap gap-1 mb-4 border-b print:hidden">
          {mod.tabs.map((x) => (
            <button key={x.key} onClick={() => setTab(x.key)} className={`px-3 py-2 text-sm -mb-px border-b-2 ${x.key === tab ? "border-accent font-semibold" : "border-transparent text-muted-foreground"}`}>{x.label}</button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4 print:hidden">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
        </div>
        {isTenants ? <div className="flex items-center gap-2">
          <Label htmlFor="tenant-sort">Sort by</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="tenant-sort" className="w-44" aria-label="Sort by"><SelectValue /></SelectTrigger>
            <SelectContent>{cols.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
          <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" variant="outline" aria-label={descending ? "Sort ascending" : "Sort descending"} onClick={() => setDescending((value) => !value)}>{descending ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent>{descending ? "Descending — switch to ascending" : "Ascending — switch to descending"}</TooltipContent></Tooltip></TooltipProvider>
        </div> : <>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" aria-label="From date" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" aria-label="To date" />
        </>}
      </div>

      <div className="bg-card border rounded-xl overflow-x-auto">
        <table className={`w-full text-sm ${isTenants ? "min-w-[1200px]" : ""}`}>
          <thead className="bg-muted/60 text-left">
            <tr>
              {cols.map((c) => <th key={c.key} className="px-3 py-2.5 font-medium whitespace-nowrap">{c.label}</th>)}
              <th className="px-3 py-2.5 print:hidden">{isTenants ? "Contacts / actions" : ""}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={cols.length + 1} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && !visible.length && <tr><td colSpan={cols.length + 1} className="p-8 text-center text-muted-foreground">No records yet.</td></tr>}
            {visible.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                {cols.map((c) => {
                  const v = c.key === "member_id" ? memberName(r.member_id) : get(r, c);
                  return (
                    <td key={c.key} className="px-3 py-2 align-top max-w-xs">
                      {c.key === "status" && v ? <Badge variant="outline" className={tone(String(v))}>{String(v).replace(/_/g, " ")}</Badge>
                        : isTenants && c.key === "is_active" ? <Badge variant="outline" className={v ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground"}>{v ? "Active" : "Inactive"}</Badge>
                        : isTenants && c.key === "contact_email" && v ? <a className="text-primary underline underline-offset-4 break-all" href={`mailto:${v}`}>{String(v)}</a>
                        : isTenants && c.key === "contact_phone" && v ? <a className="text-primary underline underline-offset-4 whitespace-nowrap" href={`tel:${String(v).replace(/[^+\d]/g, "")}`}>{String(v)}</a>
                        : <span className={isTenants ? "block whitespace-pre-wrap break-words" : "line-clamp-2"}>{fmt(v)}</span>}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right whitespace-nowrap print:hidden">
                  {r.extra?.out_of_service && r.status !== "resolved" && <Badge className="mr-2 bg-destructive text-destructive-foreground">OUT OF SERVICE</Badge>}
                  {isOpen(r) && <Button size="sm" variant="outline" className="mr-1" onClick={() => close(r)}>{mod.close?.label}</Button>}
                  <Button size="icon" variant="ghost" onClick={() => setEditing(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                  {mod.table === "tenants" && (
                    <TooltipProvider><Tooltip><TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => setContactTenant(r)} aria-label={`Out-of-hours contacts for ${r.name}`}><Phone className="h-4 w-4" /></Button>
                    </TooltipTrigger><TooltipContent>Out-of-hours contacts</TooltipContent></Tooltip></TooltipProvider>
                  )}
                  {canDelete && <Button size="icon" variant="ghost" onClick={() => remove(r)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{visible.length} record(s)</p>

      {contactTenant && <TenantContacts tenant={contactTenant} onClose={() => setContactTenant(null)} />}

      {editing && (
        <EntryDialog mod={mod} table={mod.table} fields={fields} filter={filter} row={editing} members={members}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: key }); }} />
      )}
    </div>
  );
}

function EntryDialog({ mod, table, fields, filter, row, members, onClose, onSaved }: {
  mod: ReturnType<typeof moduleByPath>; table: string; fields: Field[]; filter: Record<string, string>; row: Row; members: Row[]; onClose: () => void; onSaved: () => void;
}) {
  const [vals, setVals] = useState<Row>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const v: Row = {};
    for (const f of fields) {
      const raw = f.json ? row[f.json]?.[f.key] : row[f.key];
      if (f.type === "datetime") v[f.key] = raw ? toLocalInput(raw) : f.required && !row.id ? nowLocal() : "";
      else if (f.type === "boolean") v[f.key] = raw ?? (f.key === "is_active" || f.key === "in_order" ? true : false);
      else v[f.key] = raw ?? (f.type === "date" && !row.id ? new Date().toISOString().slice(0, 10) : "");
    }
    setVals(v);
  }, [row, fields]);
  const set = (k: string, v: unknown) => setVals((s: Row) => ({ ...s, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: Row = { ...filter };
    for (const f of fields) {
      let v = vals[f.key];
      if (f.type === "datetime") v = v ? new Date(v).toISOString() : null;
      else if (f.type === "number") v = v === "" || v == null ? null : Number(v);
      else if (v === "") v = null;
      if (f.json) payload[f.json] = { ...(row[f.json] ?? {}), ...(payload[f.json] ?? {}), [f.key]: v };
      else payload[f.key] = v;
    }
    if (!row.id && mod.ref) {
      const r = mod.ref, d = new Date();
      let count = 0;
      if (r.kind !== "stamp") {
        const since = r.kind === "year" ? `${d.getFullYear()}-01-01` : new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
        const { count: c } = await db(table).select("id", { count: "exact", head: true }).gte("created_at", since);
        count = c ?? 0;
      }
      const ref = r.kind === "stamp" ? stampRef(r.prefix, d) : r.kind === "year" ? yearRef(r.prefix, d, count) : dailyRef(r.prefix, d, count);
      if (r.json) payload[r.json] = { ...(payload[r.json] ?? {}), [r.field]: payload[r.json]?.[r.field] || ref };
      else payload[r.field] = payload[r.field] || ref;
    }
    if (table === "radon_tests") payload.status = radonStatus(payload.level);
    const res = row.id ? await db(table).update(payload).eq("id", row.id) : await insertOrQueue(table, payload);
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("queued" in res && res.queued ? "Saved offline — will upload when the internet is back" : "Saved");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{row.id ? "Edit entry" : "New entry"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key} className={f.type === "textarea" || f.type === "photo" || f.type === "yna" || f.label.length > 40 ? "sm:col-span-2" : ""}>
              <Label className="mb-1.5 block">{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
              {f.type === "textarea" ? (
                <Textarea value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} required={f.required} placeholder={f.placeholder} />
              ) : f.type === "tenant" ? (
                <TenantAutocomplete value={vals[f.key] ?? ""} onChange={(v) => set(f.key, v)} required={f.required} />
              ) : f.type === "yna" ? (
                <div className="flex gap-1">
                  {[["Yes", "bg-success text-success-foreground"], ["No", "bg-destructive text-destructive-foreground"], ["N/A", "bg-muted-foreground text-background"]].map(([o, on]) => (
                    <button key={o} type="button" onClick={() => set(f.key, o)} className={`px-4 py-1.5 rounded-md text-xs font-semibold border ${vals[f.key] === o ? on : "bg-card hover:bg-muted"}`}>{o}</button>
                  ))}
                </div>
              ) : f.type === "photo" ? (
                <PhotoField value={vals[f.key] ?? ""} onChange={(v) => set(f.key, v)} folder={table} />
              ) : f.type === "boolean" ? (
                <Switch checked={!!vals[f.key]} onCheckedChange={(c) => set(f.key, c)} />
              ) : f.type === "select" ? (
                <Select value={vals[f.key] || undefined} onValueChange={(v) => set(f.key, v)} required={!!f.required}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {(f.key === "member_id" || f.key === "contractor_id" ? members.map((m) => ({ v: m.id, l: m.name })) : (f.options ?? []).map((o) => ({ v: o, l: o.replace(/_/g, " ") }))).map((o) => (
                      <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input type={f.type === "datetime" ? "datetime-local" : f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} step="any"
                  value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} required={f.required} placeholder={f.placeholder} />
              )}
            </div>
          ))}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
