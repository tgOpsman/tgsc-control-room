import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv, fmt } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/audit-log")({
  head: () => ({ meta: [
    { title: "GDPR Audit Trail — Control Room Manager" },
    { name: "description", content: "Permanent record of every add, change and delete across the app." },
    { property: "og:title", content: "GDPR Audit Trail — Control Room Manager" },
    { property: "og:description", content: "Permanent record of every add, change and delete across the app." },
  ] }),
  component: Page,
});

function Page() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const { data = [] } = useQuery({ queryKey: ["audit"], queryFn: async () => (await supabase.from("compliance_audit_logs").select("*").order("occurred_at", { ascending: false }).limit(1000)).data ?? [] });
  const rows = data.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="p-6 md:p-8 max-w-[1300px] mx-auto">
      <div className="flex justify-between gap-4 flex-wrap mb-2"><h1 className="text-3xl font-bold">UK GDPR Audit Trail</h1><Button variant="outline" onClick={() => downloadCsv("audit-trail", rows as any)}>Export CSV</Button></div>
      <p className="text-sm text-muted-foreground mb-4">Written automatically by the database. Entries can never be edited or deleted — not even by admins.</p>
      <Input placeholder="Search by table, person or record…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-md" />
      <div className="bg-card border rounded-xl overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/60 text-left"><tr>{["When","Who","Action","Log","Record"].map((h) => <th key={h} className="px-3 py-2.5">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => (<>
          <tr key={r.id} className="border-t cursor-pointer hover:bg-muted/30" onClick={() => setOpen(open === r.id ? null : r.id)}>
            <td className="px-3 py-2">{fmt(r.occurred_at)}</td><td className="px-3 py-2">{r.actor_email ?? "system"}</td>
            <td className="px-3 py-2"><span className={r.action === "DELETE" ? "text-destructive font-semibold" : r.action === "INSERT" ? "text-success font-semibold" : "font-semibold"}>{r.action}</span></td>
            <td className="px-3 py-2">{r.table_name.replace(/_/g, " ")}</td><td className="px-3 py-2 font-mono text-xs">{r.record_id?.slice(0, 8)}</td>
          </tr>
          {open === r.id && <tr key={r.id + "d"}><td colSpan={5} className="bg-muted/40 p-3"><div className="grid md:grid-cols-2 gap-3 text-xs font-mono"><pre className="whitespace-pre-wrap">Before: {JSON.stringify(r.old_data, null, 1)}</pre><pre className="whitespace-pre-wrap">After: {JSON.stringify(r.new_data, null, 1)}</pre></div></td></tr>}
        </>))}</tbody></table></div>
    </div>
  );
}
