import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, List, Printer } from "lucide-react";
import { db } from "@/lib/db";
import { SHIFT_CODES, shiftHours } from "@/lib/roster";
import { Button } from "@/components/ui/button";
import { ModulePage } from "@/components/app/ModulePage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
const pad = (n: number) => String(n).padStart(2, "0");

export function RosterGrid() {
  const qc = useQueryClient();
  const [list, setList] = useState(false);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const y = month.getFullYear(), m = month.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const from = `${y}-${pad(m + 1)}-01`, to = `${y}-${pad(m + 1)}-${pad(days)}`;
  const { data: members = [] } = useQuery({ queryKey: ["members"], queryFn: async () => (await db("team_members").select("*").eq("is_active", true).order("team").order("name")).data as Row[] });
  const key = ["roster", from];
  const { data: shifts = [] } = useQuery({ queryKey: key, queryFn: async () => (await db("roster_shifts").select("*").gte("shift_date", from).lte("shift_date", to)).data as Row[] });
  const map = useMemo(() => { const o: Record<string, Row> = {}; for (const s of shifts) o[`${s.member_id}|${s.shift_date}`] = s; return o; }, [shifts]);

  const setCell = async (member: string, date: string, code: string) => {
    const ex = map[`${member}|${date}`];
    const res = !code ? await db("roster_shifts").delete().eq("id", ex.id)
      : ex ? await db("roster_shifts").update({ shift_code: code }).eq("id", ex.id)
      : await db("roster_shifts").insert({ member_id: member, shift_date: date, shift_code: code });
    if (res.error) { toast.error(res.error.message); return; }
    qc.invalidateQueries({ queryKey: key });
  };

  if (list) return <div><div className="px-8 pt-6"><Button variant="outline" size="sm" onClick={() => setList(false)}>Back to grid</Button></div><ModulePage path="/team-rostering" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-[1800px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Team Rostering</h1>
          <p className="text-muted-foreground text-sm">D 05:30–17:30 · N 17:30–05:30 · E 06:15–16:15 · B 08:15–18:15 · M 11:30–19:30 · L 14:30–23:30 · SD 07:30–17:30 · SB 09:30–17:30</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="icon" onClick={() => setMonth(new Date(y, m - 1, 1))} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
          <div className="px-3 py-2 text-sm font-semibold min-w-36 text-center">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
          <Button variant="outline" size="icon" onClick={() => setMonth(new Date(y, m + 1, 1))} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setList(true)}><List className="h-4 w-4" /> List / import</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
        </div>
      </div>
      {!members.length && <p className="text-muted-foreground text-sm mb-4">Add colleagues in Team Members first.</p>}
      <div className="bg-card border rounded-xl overflow-x-auto">
        <table className="text-xs">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-2 py-2 text-left sticky left-0 bg-muted min-w-40">Colleague</th>
              {Array.from({ length: days }, (_, i) => { const d = new Date(y, m, i + 1); const we = d.getDay() === 0 || d.getDay() === 6; return <th key={i} className={`px-1 py-2 w-10 ${we ? "text-accent" : ""}`}>{d.toLocaleDateString("en-GB", { weekday: "narrow" })}<br />{i + 1}</th>; })}
              <th className="px-2">Hrs</th>
            </tr>
          </thead>
          <tbody>
            {members.map((mb) => {
              let hrs = 0;
              return (
                <tr key={mb.id} className="border-t">
                  <td className="px-2 py-1 sticky left-0 bg-card font-medium">{mb.name}<div className="text-muted-foreground font-normal">{mb.role_group ?? mb.team}</div></td>
                  {Array.from({ length: days }, (_, i) => {
                    const date = `${y}-${pad(m + 1)}-${pad(i + 1)}`; const s = map[`${mb.id}|${date}`]; hrs += shiftHours(s?.shift_code);
                    return (
                      <td key={i} className="p-0.5">
                        <select aria-label={`${mb.name} ${date}`} value={s?.shift_code ?? ""} onChange={(e) => setCell(mb.id, date, e.target.value)}
                          className={`w-10 h-8 text-center rounded border appearance-none ${s ? (shiftHours(s.shift_code) ? "bg-primary text-primary-foreground" : "bg-muted") : "bg-background"}`}>
                          <option value="" />
                          {SHIFT_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                    );
                  })}
                  <td className="px-2 font-mono font-semibold">{hrs}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
