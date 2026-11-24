import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { db, fmt } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { ModulePage } from "@/components/app/ModulePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
export const CHECKPOINTS = ["Level N", "Level K", "Level F", "Tenant Car Park"];
const dur = (ms: number) => { const m = Math.floor(ms / 60000); return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`; };

export function PatrolRunner() {
  const qc = useQueryClient();
  const { name } = useAuth();
  const [tab, setTab] = useState<"live" | "history">("live");
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t); }, []);
  const { data: active = [] } = useQuery({ queryKey: ["patrols"], queryFn: async () => (await db("car_park_patrols").select("*").eq("status", "active").order("patrol_start", { ascending: false })).data as Row[] });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["patrols"] }); qc.invalidateQueries({ queryKey: ["mod"] }); };
  const [notes, setNotes] = useState<Record<string, string>>({});

  const start = async () => {
    const { error } = await db("car_park_patrols").insert({ officer_name: name, status: "active", patrol_start: new Date().toISOString(), checkpoints: [] });
    if (error) toast.error(error.message); else refresh();
  };
  const log = async (p: Row, cp: string) => {
    const list = [...(p.checkpoints ?? []), { checkpoint: cp, at: new Date().toISOString(), notes: notes[`${p.id}${cp}`] || null }];
    await db("car_park_patrols").update({ checkpoints: list }).eq("id", p.id);
    setNotes((n) => ({ ...n, [`${p.id}${cp}`]: "" })); refresh();
  };
  const end = async (p: Row) => {
    const missed = CHECKPOINTS.filter((c) => !(p.checkpoints ?? []).some((x: Row) => x.checkpoint === c));
    if (missed.length && !confirm(`Not yet logged: ${missed.join(", ")}. End anyway?`)) return;
    await db("car_park_patrols").update({ status: "completed", patrol_end: new Date().toISOString() }).eq("id", p.id);
    refresh();
  };

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Car Park Patrol</h1>
        <div className="flex gap-2">
          <Button size="sm" variant={tab === "live" ? "default" : "outline"} onClick={() => setTab("live")}>Live</Button>
          <Button size="sm" variant={tab === "history" ? "default" : "outline"} onClick={() => setTab("history")}>History</Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={start}>Start patrol</Button>
        </div>
      </div>
      {tab === "history" ? <div className="-mx-6 md:-mx-8"><ModulePage path="/car-park-patrol" /></div> : (
        <div className="space-y-4">
          {!active.length && <div className="bg-card border rounded-xl p-8 text-center text-sm text-muted-foreground">No patrol running. Press Start patrol.</div>}
          {active.map((p) => {
            const done = p.checkpoints ?? [];
            const stale = Date.now() - new Date(p.patrol_start).getTime() >= 12 * 3.6e6;
            return (
              <div key={p.id} className={`bg-card border rounded-xl p-4 ${stale ? "border-destructive/60" : ""}`}>
                <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                  <div><div className="font-semibold">{p.officer_name}</div><div className="text-xs text-muted-foreground">Started {fmt(p.patrol_start)}</div></div>
                  <div className="font-mono text-2xl font-bold">{dur(Date.now() - new Date(p.patrol_start).getTime())}</div>
                  <Button variant="outline" onClick={() => end(p)}>End patrol</Button>
                </div>
                {stale && <div className="text-sm text-destructive font-semibold mb-2">Open over 12 hours — end it or check on the officer.</div>}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {CHECKPOINTS.map((cp) => {
                    const hits = done.filter((x: Row) => x.checkpoint === cp);
                    return (
                      <div key={cp} className={`rounded-lg border p-3 ${hits.length ? "bg-success/10 border-success/40" : ""}`}>
                        <div className="font-semibold">{cp}</div>
                        {hits.map((h: Row, i: number) => <div key={i} className="text-xs text-muted-foreground">{fmt(h.at)}{h.notes ? ` · ${h.notes}` : ""}</div>)}
                        <Input className="mt-2 h-8 text-sm" placeholder="Notes (optional)" value={notes[`${p.id}${cp}`] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [`${p.id}${cp}`]: e.target.value }))} />
                        <Button size="sm" className="w-full mt-2" onClick={() => log(p, cp)}>Log {cp}</Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
