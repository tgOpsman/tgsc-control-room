import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { TRAINING_SECTIONS, trainingProgress } from "@/lib/roster";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ModulePage } from "@/components/app/ModulePage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

export function TrainingHub() {
  const [records, setRecords] = useState(false);
  const { data: members = [] } = useQuery({ queryKey: ["members"], queryFn: async () => (await db("team_members").select("*").order("name")).data as Row[] });
  const { data: recs = [] } = useQuery({ queryKey: ["training-all"], queryFn: async () => (await db("training_records").select("member_id,programme,section,status")).data as Row[] });
  if (records) return <div><div className="px-8 pt-6"><Button variant="outline" size="sm" onClick={() => setRecords(false)}>Back to progress</Button></div><ModulePage path="/training-records" /></div>;
  return (
    <div className="p-6 md:p-8 max-w-[1300px] mx-auto">
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Training Hub</h1>
          <p className="text-muted-foreground text-sm">Westgrove induction — Controller/Dual Service (12 sections) and Cleaning (4 sections). A section counts once marked competent.</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setRecords(true)}>Training records</Button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {members.map((m) => {
          const prog = m.team === "Cleaning" ? "Cleaning" : "Controller/Dual Service";
          const done = recs.filter((r) => r.member_id === m.id && r.programme === prog && r.status === "competent").map((r) => String(r.section ?? "").trim()).filter(Boolean);
          const pct = trainingProgress(prog, done);
          return (
            <div key={m.id} className="bg-card border rounded-xl p-4">
              <div className="flex justify-between"><div className="font-semibold">{m.name}</div><div className="font-mono font-bold">{pct}%</div></div>
              <div className="text-xs text-muted-foreground mb-2">{prog} · {new Set(done).size}/{TRAINING_SECTIONS[prog]} sections</div>
              <Progress value={pct} />
            </div>
          );
        })}
        {!members.length && <p className="text-muted-foreground text-sm">Add colleagues in Team Members first.</p>}
      </div>
    </div>
  );
}
