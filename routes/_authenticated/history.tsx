import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { db, downloadCsv, fmt } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [
    { title: "Visit & Access History — Control Room Manager" },
    { name: "description", content: "Combined timeline of vehicle visits and person check-ins." },
    { property: "og:title", content: "Visit & Access History — Control Room Manager" },
    { property: "og:description", content: "Combined timeline of vehicle visits and person check-ins." },
  ] }),
  component: History,
});

function History() {
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const [v, c] = await Promise.all([
        db("vehicle_visits").select("*").order("check_in_time", { ascending: false }).limit(1000),
        db("check_in_records").select("*").order("check_in_time", { ascending: false }).limit(1000),
      ]);
      const rows = [
        ...(v.data ?? []).map((r: any) => ({ type: "Vehicle", name: r.driver_name, ref: r.licence_plate, company: r.driver_company, destination: r.destination_tenant, in: r.check_in_time, out: r.check_out_time, status: r.status })),
        ...(c.data ?? []).map((r: any) => ({ type: r.visit_type === "RoofAccess" ? "Roof/Plant" : r.visit_type, name: r.full_name, ref: r.badge_number || r.booking_ref, company: r.company, destination: r.destination, in: r.check_in_time, out: r.check_out_time, status: r.status })),
      ];
      return rows.sort((a, b) => String(b.in).localeCompare(String(a.in)));
    },
  });
  const rows = data.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="flex justify-between mb-6 gap-4 flex-wrap"><h1 className="text-3xl font-bold">Visit & Access History</h1><Button variant="outline" onClick={() => downloadCsv("history", rows)}>Export CSV</Button></div>
      <Input placeholder="Search plate, name, company…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-md" />
      <div className="bg-card border rounded-xl overflow-x-auto">
        <table className="w-full text-sm"><thead className="bg-muted/60 text-left"><tr>{["Type","Name","Plate / badge","Company","Destination","In","Out","Status"].map((h) => <th key={h} className="px-3 py-2.5">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="border-t">{[r.type, r.name, r.ref, r.company, r.destination, r.in, r.out, r.status].map((v, j) => <td key={j} className="px-3 py-2">{fmt(v)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
