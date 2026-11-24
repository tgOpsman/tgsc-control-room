import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Printer, Trash2 } from "lucide-react";
import { db, fmt, nowLocal } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { dailyRef, missingComments, type ChecklistValue } from "@/lib/refs";
import { ToggleQuestion } from "@/components/app/ToggleQuestion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
type Q = { key: string; label: string };
const SECTIONS: { title: string; items: Q[] }[] = [
  { title: "Equipment checks", items: [
    { key: "radios", label: "All radios accounted for, working & signed in/out?" },
    { key: "bodycams", label: "All bodycams accounted for, working & signed in/out?" },
    { key: "keys", label: "All keys & passes accounted for & signed in/out?" },
    { key: "bms", label: "BMS system in full working order?" },
    { key: "access", label: "Access control system in full working order?" },
    { key: "cctv", label: "CCTV working & cameras in home positions?" },
    { key: "q7_pc", label: "Q7 Fire alarm PC — no faults or anomalies?" },
    { key: "q7_panel", label: "Q7 Fire alarm panel — no faults or anomalies?" },
  ] },
  { title: "Escalators, lifts & car park", items: [
    { key: "escalators", label: "Escalators 1–8 all running?" },
    { key: "lifts", label: "Passenger & goods lifts all in service?" },
    { key: "barriers", label: "Car park barriers & pay stations working?" },
    { key: "shutters", label: "Shutters & S24–S26 doors working?" },
  ] },
  { title: "Control duties", items: [
    { key: "logs", label: "All logs completed for the shift?" },
    { key: "patrols", label: "Patrols completed and logged?" },
    { key: "lost_found", label: "Lost property logged and stored?" },
    { key: "incidents", label: "Incidents reported and handed over?" },
    { key: "control_tidy", label: "Control room clean and tidy?" },
  ] },
];
const ALLQ = SECTIONS.flatMap((s) => s.items);

export function HandoverPage() {
  const qc = useQueryClient();
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Row | null>(null);
  const { data: rows = [] } = useQuery({
    queryKey: ["handovers"],
    queryFn: async () => (await db("handover_reports").select("*").order("created_at", { ascending: false }).limit(500)).data as Row[],
  });
  const remove = async (r: Row) => {
    if (!confirm("Delete this handover? The deletion is kept in the audit trail.")) return;
    const { error } = await db("handover_reports").delete().eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["handovers"] });
  };
  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Shift Handover</h1>
          <p className="text-muted-foreground text-sm mt-1">Six-section handover: people, equipment, Q7 fire alarm, escalators/lifts/car park, defects, control duties.</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New handover</Button>
      </div>
      <div className="bg-card border rounded-xl divide-y">
        {!rows.length && <div className="p-8 text-center text-muted-foreground text-sm">No handovers yet.</div>}
        {rows.map((r) => {
          const nos = Object.values((r.checklist ?? {}) as Record<string, ChecklistValue>).filter((v) => v?.answer === "no").length;
          return (
            <div key={r.id} className="p-4 flex flex-wrap items-center gap-3 hover:bg-muted/30">
              <button className="text-left flex-1 min-w-60" onClick={() => setView(r)}>
                <div className="font-mono text-xs text-muted-foreground">{r.reference ?? "—"}</div>
                <div className="font-medium">{r.author} → {r.extra?.received_by ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{fmt(r.extra?.handover_at ?? r.created_at)} · {r.shift ?? ""}</div>
              </button>
              {nos ? <Badge variant="outline" className="bg-warning/20 border-warning/40">{nos} issue(s)</Badge> : <Badge variant="outline" className="bg-success/15 text-success border-success/30">All clear</Badge>}
              {(role === "admin" || role === "manager") && <Button size="icon" variant="ghost" onClick={() => remove(r)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
            </div>
          );
        })}
      </div>
      {open && <HandoverForm count={rows.filter((r) => r.shift_date === new Date().toISOString().slice(0, 10)).length} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["handovers"] }); }} />}
      {view && <HandoverView r={view} onClose={() => setView(null)} />}
    </div>
  );
}

function HandoverForm({ count, onClose, onSaved }: { count: number; onClose: () => void; onSaved: () => void }) {
  const { name } = useAuth();
  const [givenBy, setGivenBy] = useState(name);
  const [receivedBy, setReceivedBy] = useState("");
  const [at, setAt] = useState(nowLocal());
  const [shift, setShift] = useState(new Date().getHours() >= 6 && new Date().getHours() < 18 ? "Day" : "Night");
  const [vals, setVals] = useState<Record<string, ChecklistValue>>(() => Object.fromEntries(ALLQ.map((q) => [q.key, { answer: "" }])));
  const [defects, setDefects] = useState<{ description: string; location: string }[]>([]);
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const missing = useMemo(() => missingComments(vals), [vals]);
  const unanswered = ALLQ.filter((q) => !vals[q.key]?.answer).length;

  const save = async () => {
    setTried(true);
    if (!givenBy || !receivedBy) { toast.error("Enter who gave and received the handover"); return; }
    if (unanswered) { toast.error(`${unanswered} question(s) not answered`); return; }
    if (missing.length) { toast.error("Add comments for every 'No' answer"); return; }
    setSaving(true);
    const d = new Date(at);
    const reference = dailyRef("HD", d, count);
    const real = defects.filter((x) => x.description.trim());
    const { error } = await db("handover_reports").insert({
      reference, shift_date: at.slice(0, 10), shift, author: givenBy, checklist: vals, summary: notes || null,
      issues: real.map((x) => `${x.location}: ${x.description}`).join("\n") || null,
      extra: { received_by: receivedBy, handover_at: d.toISOString(), defects: real },
    });
    if (!error && real.length) {
      await db("defect_reports").insert(real.map((x) => ({ report_datetime: d.toISOString(), location: x.location, description: x.description, reported_by: givenBy, status: "open", extra: { from_handover: reference } })));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Handover ${reference} saved`);
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New shift handover</DialogTitle></DialogHeader>
        <Section n={1} title="Handover information">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Given by *</Label><Input value={givenBy} onChange={(e) => setGivenBy(e.target.value)} /></div>
            <div><Label>Received by *</Label><Input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className={tried && !receivedBy ? "border-destructive" : ""} /></div>
            <div><Label>Date & time</Label><Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} /></div>
            <div><Label>Shift</Label>
              <div className="flex gap-1 mt-1">{["Day", "Night"].map((s) => <Button key={s} type="button" size="sm" variant={shift === s ? "default" : "outline"} onClick={() => setShift(s)}>{s}</Button>)}</div>
            </div>
          </div>
        </Section>
        {SECTIONS.map((s, i) => (
          <Section key={s.title} n={i === 2 ? 5 : i + 2} title={s.title}>
            {s.items.map((q) => (
              <ToggleQuestion key={q.key} label={q.label} value={vals[q.key]!} invalid={tried && missing.includes(q.key)}
                onChange={(v) => setVals((x) => ({ ...x, [q.key]: v }))} />
            ))}
          </Section>
        )).flatMap((el, i) => i === 2 ? [
          <Section key="defects" n={4} title="Defects found this shift">
            <p className="text-xs text-muted-foreground mb-2">Each defect is also added to Site Defect Reports.</p>
            {defects.map((d, i) => (
              <div key={i} className="grid sm:grid-cols-[1fr_2fr_auto] gap-2 mb-2">
                <Input placeholder="Location" value={d.location} onChange={(e) => setDefects((x) => x.map((y, j) => j === i ? { ...y, location: e.target.value } : y))} />
                <Input placeholder="Description" value={d.description} onChange={(e) => setDefects((x) => x.map((y, j) => j === i ? { ...y, description: e.target.value } : y))} />
                <Button type="button" variant="ghost" size="icon" onClick={() => setDefects((x) => x.filter((_, j) => j !== i))} aria-label="Remove defect"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setDefects((x) => [...x, { description: "", location: "" }])}><Plus className="h-4 w-4" /> Add defect</Button>
          </Section>, el] : [el])}
        <Section n={6} title="Additional notes">
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the next shift needs to know…" />
        </Section>
        <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={save}>{saving ? "Saving…" : "Submit handover"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <h3 className="font-semibold text-sm mb-2"><span className="text-accent font-mono mr-2">{n}</span>{title}</h3>
      {children}
    </div>
  );
}

function HandoverView({ r, onClose }: { r: Row; onClose: () => void }) {
  const c = (r.checklist ?? {}) as Record<string, ChecklistValue>;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto print:max-h-none">
        <DialogHeader><DialogTitle>Handover {r.reference}</DialogTitle></DialogHeader>
        <div className="text-sm grid grid-cols-2 gap-2">
          <div><b>Given by:</b> {r.author}</div><div><b>Received by:</b> {r.extra?.received_by}</div>
          <div><b>When:</b> {fmt(r.extra?.handover_at ?? r.created_at)}</div><div><b>Shift:</b> {r.shift}</div>
        </div>
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h3 className="font-semibold text-sm mt-2">{s.title}</h3>
            {s.items.map((q) => (
              <div key={q.key} className="text-sm flex justify-between border-b py-1 gap-4">
                <span>{q.label}{c[q.key]?.comments && <span className="block text-xs text-muted-foreground">{c[q.key]!.comments}</span>}</span>
                <span className={`font-semibold uppercase ${c[q.key]?.answer === "no" ? "text-destructive" : ""}`}>{c[q.key]?.answer || "—"}</span>
              </div>
            ))}
          </div>
        ))}
        {r.issues && <div className="text-sm"><b>Defects:</b><pre className="whitespace-pre-wrap font-sans">{r.issues}</pre></div>}
        {r.summary && <div className="text-sm"><b>Notes:</b> {r.summary}</div>}
        <Button variant="outline" className="print:hidden" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
      </DialogContent>
    </Dialog>
  );
}
