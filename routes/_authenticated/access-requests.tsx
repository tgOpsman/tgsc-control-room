import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmt } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/access-requests")({
  head: () => ({ meta: [
    { title: "Access Requests — Control Room Manager" },
    { name: "description", content: "Review requests from people asking to join the control room app." },
    { property: "og:title", content: "Access Requests — Control Room Manager" },
    { property: "og:description", content: "Review requests from people asking to join the control room app." },
  ] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["access_requests"], queryFn: async () => (await supabase.from("access_requests").select("*").order("created_at", { ascending: false })).data ?? [] });
  const act = async (id: string, status: string) => { await supabase.from("access_requests").update({ status }).eq("id", id); qc.invalidateQueries({ queryKey: ["access_requests"] }); };
  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto">
      <h1 className="text-3xl font-bold mb-1">Access Requests</h1>
      <p className="text-sm text-muted-foreground mb-6">Approving marks the request. Then create their account (username, temporary password and role) in the User Directory.</p>
      <div className="space-y-3">
        {data.map((r) => (
          <div key={r.id} className="bg-card border rounded-lg p-4 flex justify-between gap-4">
            <div><div className="font-semibold">{r.full_name} <span className="text-muted-foreground font-normal">· {r.email}</span></div><div className="text-sm text-muted-foreground">{r.company} {r.reason && "— " + r.reason}</div><div className="text-xs text-muted-foreground mt-1">{fmt(r.created_at)} · {r.status}</div></div>
            {r.status === "pending" && <div className="flex gap-2"><Button size="sm" onClick={() => act(r.id, "approved")}>Approve</Button><Button size="sm" variant="outline" onClick={() => act(r.id, "rejected")}>Reject</Button></div>}
          </div>
        ))}
        {!data.length && <p className="text-muted-foreground">No requests.</p>}
      </div>
    </div>
  );
}
