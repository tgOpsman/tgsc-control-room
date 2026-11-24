import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { quarterRange } from "@/lib/overdue";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/quarterly-archive")({
  head: () => ({
    meta: [
      { title: "Quarterly Archive — Control Room Manager" },
      { name: "description", content: "Archive finished visits from a past quarter." },
      { property: "og:title", content: "Quarterly Archive — Control Room Manager" },
      { property: "og:description", content: "Archive finished visits from a past quarter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Archive,
});

const TABLES = [["Person visits", "check_in_records"], ["Vehicle visits", "vehicle_visits"]] as const;

function Archive() {
  const qc = useQueryClient();
  const now = new Date();
  const lastQ = Math.floor(now.getMonth() / 3) || 4;
  const [year, setYear] = useState(String(lastQ === 4 ? now.getFullYear() - 1 : now.getFullYear()));
  const [q, setQ] = useState(String(lastQ));
  const { start, end } = quarterRange(Number(year), Number(q));
  const past = end <= now;
  const { data } = useQuery({
    queryKey: ["qarchive", year, q],
    queryFn: () => Promise.all(TABLES.map(async ([label, t]) => {
      const { count } = await db(t).select("id", { count: "exact", head: true }).eq("archived", false).neq("status", "active").gte("check_in_time", start.toISOString()).lt("check_in_time", end.toISOString());
      return { label, t, n: count ?? 0 };
    })),
  });
  const run = async () => {
    for (const [, t] of TABLES) {
      const { error } = await db(t).update({ archived: true }).eq("archived", false).neq("status", "active").gte("check_in_time", start.toISOString()).lt("check_in_time", end.toISOString());
      if (error) { toast.error(error.message); return; }
    }
    toast.success(`Q${q} ${year} archived`); qc.invalidateQueries();
  };
  const total = (data ?? []).reduce((a, r) => a + r.n, 0);
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold">Quarterly Archive</h1>
      <p className="text-sm text-muted-foreground mb-5">Hides finished person and vehicle visits from the live lists. Nothing is deleted — archived records stay in Visit History and the audit trail.</p>
      <div className="flex gap-2 mb-5">
        <Select value={q} onValueChange={setQ}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>Q{n}</SelectItem>)}</SelectContent></Select>
        <Select value={year} onValueChange={setYear}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{[0, 1, 2, 3].map((d) => String(now.getFullYear() - d)).map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">{(data ?? []).map((r) => <div key={r.t} className="bg-card border rounded-xl p-4"><div className="text-3xl font-bold font-mono">{r.n}</div><div className="text-sm text-muted-foreground">{r.label} to archive</div></div>)}</div>
      <AlertDialog>
        <AlertDialogTrigger asChild><Button disabled={!past || !total}>{past ? `Archive ${total} records` : "Quarter not finished yet"}</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Archive Q{q} {year}?</AlertDialogTitle><AlertDialogDescription>{total} finished visits will be moved out of the live lists.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={run}>Archive</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
