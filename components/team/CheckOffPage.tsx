import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check } from "lucide-react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { deptOf, hoursSummary, shiftHours } from "@/lib/roster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function CheckOffPage() {
  const qc = useQueryClient();
  const { name } = useAuth();
  const [date, setDate] = useState(() => iso(new Date()));
  const [weekly, setWeekly] = useState(false);
  const start = useMemo(() => { if (!weekly) return date; const d = new Date(date); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); }, [date, weekly]);
  const end = useMemo(() => { if (!weekly) return date; const d = new Date(start); d.setDate(d.getDate() + 6); return iso(d); }, [start, weekly, date]);
  const { data: members = [] } = useQuery({ queryKey: ["members"], queryFn: async () => (await db("team_members").select("*").order("name")).data as Row[] });
  const { data: roster = [] } = useQuery({ queryKey: ["roster-range", start, end], queryFn: async () => (await db("roster_shifts").select("*").gte("shift_date", start).lte("shift_date", end)).data as Row[] });
  const ck = ["checkoffs", start, end];
  const { data: confs = [] } = useQuery({ queryKey: ck, queryFn: async () => (await db("shift_checkoffs").select("*").gte("shift_date", start).lte("shift_date", end)).data as Row[] });
  const { data: ins = [] } = useQuery({ queryKey: ["checkins-range", start, end], queryFn: async () => (await db("check_in_records").select("full_name,check_in_time").eq("visit_type", "Staff").gte("check_in_time", start).lte("check_in_time", `${end}T23:59:59`)).data as Row[] });
  const [hrs, setHrs] = useState<Record<string, string>>({});
  const mem = (id: string) => members.find((x) => x.id === id);

  const lines = roster.filter((r) => shiftHours(r.shift_code) > 0).sort((a, b) => a.shift_date.localeCompare(b.shift_date)).map((r) => {
    const c = confs.find((x) => x.member_id === r.member_id && x.shift_date === r.shift_date);
    const mb = mem(r.member_id);
    const signedIn = ins.some((i) => i.full_name?.toLowerCase() === mb?.name?.toLowerCase() && String(i.check_in_time).slice(0, 10) === r.shift_date);
    return { r, c, mb, signedIn, dept: deptOf(mb?.role_group, mb?.team) };
  });
  const summary = hoursSummary(lines.filter((l) => l.c).map((l) => ({ dept: l.dept, hours: Number(l.c.hours ?? 0) })));
  const unconfirmed = lines.filter((l) => !l.c).length;

  const confirm = async (l: (typeof lines)[number]) => {
    const h = Number(hrs[l.r.id] ?? shiftHours(l.r.shift_code));
    const { error } = await db("shift_checkoffs").insert({ member_id: l.r.member_id, shift_date: l.r.shift_date, hours: h, verified_by: name || null, extra: { shift_code: l.r.shift_code } });
    if (error) { toast.error(error.message); return; }
    toast.success("Confirmed"); qc.invalidateQueries({ queryKey: ck });
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Shift Check Off</h1>
      <p className="text-muted-foreground text-sm mb-4">Confirm hours worked against the roster and staff sign-ins.</p>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Button size="sm" variant={weekly ? "outline" : "default"} onClick={() => setWeekly(false)}>Daily</Button>
        <Button size="sm" variant={weekly ? "default" : "outline"} onClick={() => setWeekly(true)}>Weekly</Button>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" aria-label="Date" />
        {weekly && <span className="text-sm text-muted-foreground">{start} → {end}</span>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        {Object.entries(summary).map(([k, v]) => (
          <div key={k} className="bg-card border rounded-xl p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="text-2xl font-bold font-mono">{v}h</div></div>
        ))}
      </div>
      {unconfirmed > 0 && <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/15 p-3 mb-4 text-sm"><AlertTriangle className="h-4 w-4" /> {unconfirmed} rostered shift(s) not yet confirmed.</div>}
      <div className="bg-card border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Colleague</th><th className="px-3 py-2">Department</th><th className="px-3 py-2">Shift</th><th className="px-3 py-2">Signed in</th><th className="px-3 py-2">Hours</th><th /></tr></thead>
          <tbody>
            {!lines.length && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No rostered shifts for this period.</td></tr>}
            {lines.map((l) => (
              <tr key={l.r.id} className="border-t">
                <td className="px-3 py-2">{new Date(l.r.shift_date).toLocaleDateString("en-GB")}</td>
                <td className="px-3 py-2 font-medium">{l.mb?.name ?? "—"}</td>
                <td className="px-3 py-2">{l.dept}</td>
                <td className="px-3 py-2 font-mono">{l.r.shift_code}</td>
                <td className="px-3 py-2">{l.signedIn ? <Badge variant="outline" className="bg-success/15 text-success">Yes</Badge> : <span className="text-muted-foreground">No record</span>}</td>
                <td className="px-3 py-2">{l.c ? <span className="font-mono">{l.c.hours}h</span> : <Input type="number" step="0.25" className="w-20 h-8" value={hrs[l.r.id] ?? String(shiftHours(l.r.shift_code))} onChange={(e) => setHrs({ ...hrs, [l.r.id]: e.target.value })} aria-label="Hours" />}</td>
                <td className="px-3 py-2 text-right">{l.c ? <span className="text-xs text-muted-foreground">by {l.c.verified_by ?? "—"}</span> : <Button size="sm" onClick={() => confirm(l)}><Check className="h-4 w-4" /> Confirm</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
