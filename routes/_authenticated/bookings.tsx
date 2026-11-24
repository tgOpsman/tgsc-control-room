import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, ShieldCheck } from "lucide-react";
import { db, fmt, nowLocal, toLocalInput } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({ meta: [
    { title: "Workplace Bookings — Control Room Manager" },
    { name: "description", content: "Book spaces and assets, with safety compliance checks linked to each booking." },
    { property: "og:title", content: "Workplace Bookings — Control Room Manager" },
    { property: "og:description", content: "Book spaces and assets, with safety compliance checks linked to each booking." },
  ] }),
  component: Bookings,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function Bookings() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [view, setView] = useState<"calendar" | "table">("calendar");
  const [edit, setEdit] = useState<Row | null>(null);
  const [open, setOpen] = useState<Row | null>(null);
  const { data: rows = [] } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => (await db("bookings").select("*, compliance_checks(*)").order("start_at")).data as Row[],
  });
  const days = useMemo(() => {
    const start = new Date(month); start.setDate(1 - ((start.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [month]);
  const sameDay = (a: Date, b: string) => new Date(b).toDateString() === a.toDateString();
  const refresh = () => qc.invalidateQueries({ queryKey: ["bookings"] });

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div><h1 className="text-3xl font-bold">Workplace Bookings</h1><p className="text-sm text-muted-foreground">Spaces and assets, each with its own compliance checks.</p></div>
        <div className="flex gap-2">
          <Button variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}>Calendar</Button>
          <Button variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}>Table</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setEdit({})}><Plus className="h-4 w-4" /> New booking</Button>
        </div>
      </div>
      {view === "calendar" ? (
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <Button size="icon" variant="ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></Button>
            <div className="font-semibold">{month.toLocaleString("en-GB", { month: "long", year: "numeric" })}</div>
            <Button size="icon" variant="ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></Button>
          </div>
          <div className="grid grid-cols-7 text-xs text-muted-foreground mb-1">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <div key={d} className="px-2">{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-px bg-border border rounded overflow-hidden">
            {days.map((d) => (
              <div key={d.toISOString()} className={`bg-card min-h-24 p-1.5 ${d.getMonth() !== month.getMonth() ? "opacity-40" : ""}`}>
                <div className={`text-xs ${d.toDateString() === new Date().toDateString() ? "text-accent font-bold" : ""}`}>{d.getDate()}</div>
                {rows.filter((r) => sameDay(d, r.start_at)).map((r) => (
                  <button key={r.id} onClick={() => setOpen(r)} className="w-full text-left text-xs mt-1 px-1.5 py-0.5 rounded bg-primary text-primary-foreground truncate">
                    {new Date(r.start_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} {r.title}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full text-sm"><thead className="bg-muted/60 text-left"><tr>{["Title","Space","Asset","For","Start","End","Status","Checks"].map((h) => <th key={h} className="px-3 py-2.5">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-t cursor-pointer hover:bg-muted/30" onClick={() => setOpen(r)}>
                {[r.title, r.space, r.asset, r.booked_for, r.start_at, r.end_at, r.status].map((v, i) => <td key={i} className="px-3 py-2">{fmt(v)}</td>)}
                <td className="px-3 py-2">{r.compliance_checks?.length ?? 0}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      {edit && <BookingForm row={edit} onDone={() => { setEdit(null); refresh(); }} onClose={() => setEdit(null)} />}
      {open && <BookingDetail row={rows.find((r) => r.id === open.id) ?? open} onEdit={() => { setEdit(open); setOpen(null); }} onClose={() => setOpen(null)} onChange={refresh} />}
    </div>
  );
}

function BookingForm({ row, onDone, onClose }: { row: Row; onDone: () => void; onClose: () => void }) {
  const [v, setV] = useState<Row>({
    title: row.title ?? "", space: row.space ?? "", asset: row.asset ?? "", booked_for: row.booked_for ?? "", notes: row.notes ?? "",
    start_at: row.start_at ? toLocalInput(row.start_at) : nowLocal(), end_at: row.end_at ? toLocalInput(row.end_at) : nowLocal(),
  });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(v.end_at) <= new Date(v.start_at)) { toast.error("End must be after start"); return; }
    const payload = { ...v, start_at: new Date(v.start_at).toISOString(), end_at: new Date(v.end_at).toISOString() };
    const res = row.id ? await db("bookings").update(payload).eq("id", row.id) : await db("bookings").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Booking saved"); onDone();
  };
  const f = (k: string, l: string, t = "text") => (
    <div><Label className="mb-1.5 block">{l}</Label><Input type={t} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} required={k === "title"} /></div>
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent><DialogHeader><DialogTitle>{row.id ? "Edit booking" : "New booking"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
          {f("title", "Title *")}{f("space", "Space / room")}{f("asset", "Asset")}{f("booked_for", "Booked for")}
          {f("start_at", "Start", "datetime-local")}{f("end_at", "End", "datetime-local")}
          <div className="sm:col-span-2"><Label className="mb-1.5 block">Notes</Label><Textarea value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} /></div>
          <Button type="submit" className="sm:col-span-2 bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BookingDetail({ row, onEdit, onClose, onChange }: { row: Row; onEdit: () => void; onClose: () => void; onChange: () => void }) {
  const [c, setC] = useState({ check_type: "", checked_by: "", passed: true, notes: "" });
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await db("compliance_checks").insert({ ...c, booking_id: row.id });
    if (error) { toast.error(error.message); return; }
    setC({ check_type: "", checked_by: "", passed: true, notes: "" }); onChange();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{row.title}</DialogTitle></DialogHeader>
        <div className="text-sm space-y-1">
          <div>{fmt(row.start_at)} → {fmt(row.end_at)}</div>
          <div className="text-muted-foreground">{[row.space, row.asset, row.booked_for].filter(Boolean).join(" · ")}</div>
          {row.notes && <p>{row.notes}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={onEdit} className="w-fit">Edit booking</Button>
        <div className="border-t pt-3">
          <h3 className="font-semibold flex items-center gap-2 mb-2"><ShieldCheck className="h-4 w-4" /> Compliance checks</h3>
          {(row.compliance_checks ?? []).map((x: Row) => (
            <div key={x.id} className="text-sm flex justify-between border-b py-1.5"><span>{x.check_type} — {x.checked_by}</span><span className={x.passed ? "text-success" : "text-destructive"}>{x.passed ? "Passed" : "Failed"}</span></div>
          ))}
          <form onSubmit={add} className="grid grid-cols-2 gap-2 mt-3">
            <Input placeholder="Check (e.g. Fire exit clear)" value={c.check_type} onChange={(e) => setC({ ...c, check_type: e.target.value })} required />
            <Input placeholder="Checked by" value={c.checked_by} onChange={(e) => setC({ ...c, checked_by: e.target.value })} />
            <select className="border rounded-md px-2 bg-card text-sm" value={c.passed ? "1" : "0"} onChange={(e) => setC({ ...c, passed: e.target.value === "1" })}><option value="1">Passed</option><option value="0">Failed</option></select>
            <Button type="submit" size="sm">Add check</Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
