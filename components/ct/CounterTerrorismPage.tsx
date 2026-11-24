import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pin, Plus, ShieldAlert } from "lucide-react";
import { db, fmt } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { ThreatLevelBadge, useThreatLevel } from "@/components/app/ThreatLevel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
type Entry = { at: string; type: string; text: string; by: string; pinned?: boolean };
const TYPES = ["Action", "Decision", "Information", "Communication", "Update"];
const CARDS = [
  { t: "Bomb threat (phone)", s: ["Stay calm, keep the caller talking", "Record exact words — use the bomb threat form", "Note caller ID / number shown", "Do not hang up — use another phone to dial 999", "Inform the duty manager"] },
  { t: "Suspicious item", s: ["Do not touch — HOT: Hidden? Obviously suspicious? Typical?", "Clear the area — at least 100m", "Do not use radios or mobiles within 15m", "Dial 999 and inform the duty manager", "Control access until police arrive"] },
  { t: "Run · Hide · Tell", s: ["RUN to a place of safety if there is a safe route", "HIDE if you can't run — lock in, silence phones", "TELL the police by calling 999 when safe", "Guide public away; open safe exits", "Lockdown via control room PA and shutters"] },
];

export function CounterTerrorismPage() {
  const qc = useQueryClient();
  const { name } = useAuth();
  const { data: levels = [] } = useThreatLevel();
  const { data: incidents = [] } = useQuery({ queryKey: ["ct"], queryFn: async () => (await db("ct_incidents").select("*").order("start_datetime", { ascending: false }).limit(200)).data as Row[] });
  const [sel, setSel] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [drill, setDrill] = useState(false);
  const active = incidents.find((i) => i.id === sel) ?? incidents.find((i) => i.status !== "resolved");
  const refresh = () => qc.invalidateQueries({ queryKey: ["ct"] });

  const create = async () => {
    if (!title.trim()) return;
    const { data, error } = await db("ct_incidents").insert({ title, is_drill: drill, status: "active", logs: [] }).select().single();
    if (error) { toast.error(error.message); return; }
    setTitle(""); setSel(data.id); refresh();
  };
  const save = async (patch: Row) => {
    const { error } = await db("ct_incidents").update(patch).eq("id", active.id);
    if (error) toast.error(error.message);
    refresh();
  };
  const logs: Entry[] = active?.logs ?? [];
  const [type, setType] = useState("Action");
  const [text, setText] = useState("");
  const add = async () => {
    if (!text.trim()) return;
    await save({ logs: [...logs, { at: new Date().toISOString(), type, text, by: name }] });
    setText("");
  };
  const sorted = [...logs].map((l, i) => ({ ...l, i })).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.at.localeCompare(a.at));

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2"><ShieldAlert className="text-destructive" /> Counter Terrorism</h1>
          <p className="text-muted-foreground text-sm mt-1">Major incident decision log, UK threat level and immediate action guidance.</p>
        </div>
        <Button asChild className="bg-destructive text-destructive-foreground hover:bg-destructive/90"><Link to="/bomb-threats" search={{ new: 1 } as never}>Bomb threat form (NaCTSO)</Link></Button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <ThreatLevelBadge />
          <div className="bg-card border rounded-xl p-3 text-xs space-y-1 max-h-40 overflow-y-auto">
            <div className="font-semibold text-sm">Change history</div>
            {levels.map((l: Row) => <div key={l.id}>{fmt(l.set_at)} — <b>{l.level}</b> {l.set_by && `· ${l.set_by}`}</div>)}
            {!levels.length && <div className="text-muted-foreground">No changes recorded.</div>}
          </div>
        </div>
        {CARDS.map((c) => (
          <div key={c.t} className="bg-card border border-l-4 border-l-destructive rounded-xl p-4 text-sm">
            <div className="font-bold mb-2">{c.t}</div>
            <ol className="list-decimal ml-4 space-y-1">{c.s.map((x) => <li key={x}>{x}</li>)}</ol>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <div className="bg-card border rounded-xl p-3 space-y-3">
          <div className="space-y-2">
            <Input placeholder="New incident title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="flex items-center justify-between"><Label className="flex items-center gap-2"><Switch checked={drill} onCheckedChange={setDrill} /> Drill</Label><Button size="sm" onClick={create}><Plus className="h-4 w-4" /> Start incident</Button></div>
          </div>
          <div className="divide-y">
            {incidents.map((i) => (
              <button key={i.id} onClick={() => setSel(i.id)} className={`w-full text-left py-2 px-1 text-sm ${active?.id === i.id ? "bg-muted rounded" : ""}`}>
                <div className="font-medium">{i.title} {i.is_drill && <Badge variant="outline">Drill</Badge>}</div>
                <div className="text-xs text-muted-foreground">{fmt(i.start_datetime)} · {i.status}</div>
              </button>
            ))}
            {!incidents.length && <div className="text-sm text-muted-foreground py-4 text-center">No incidents.</div>}
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          {!active ? <div className="text-muted-foreground text-sm">Select or start an incident to keep a decision log.</div> : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><div className="text-lg font-bold">{active.title}</div><div className="text-xs text-muted-foreground">Started {fmt(active.start_datetime)}</div></div>
                <div className="flex gap-1 print:hidden">
                  {["active", "monitoring", "resolved"].map((s) => <Button key={s} size="sm" variant={active.status === s ? "default" : "outline"} className="capitalize" onClick={() => save({ status: s })}>{s}</Button>)}
                  <Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <div className="flex gap-1">{TYPES.map((t) => <Button key={t} size="sm" variant={type === t ? "default" : "outline"} onClick={() => setType(t)}>{t}</Button>)}</div>
                <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="What happened / what was decided and why…" />
                <Button onClick={add} className="bg-accent text-accent-foreground hover:bg-accent/90">Add to log</Button>
              </div>
              <div className="divide-y">
                {sorted.map((l) => (
                  <div key={l.i} className={`py-2 text-sm flex gap-3 ${l.pinned ? "bg-warning/10" : ""}`}>
                    <div className="font-mono text-xs w-28 shrink-0">{fmt(l.at)}</div>
                    <Badge variant="outline" className="h-fit">{l.type}</Badge>
                    <div className="flex-1">{l.text}<div className="text-xs text-muted-foreground">{l.by}</div></div>
                    <button className="print:hidden" aria-label="Pin entry" onClick={() => save({ logs: logs.map((x, j) => j === l.i ? { ...x, pinned: !x.pinned } : x) })}><Pin className={`h-4 w-4 ${l.pinned ? "text-accent" : "text-muted-foreground"}`} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
