import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmt } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/login-log")({
  head: () => ({ meta: [
    { title: "Login Log — Control Room Manager" },
    { name: "description", content: "Every staff sign-in, for UK GDPR accountability." },
    { property: "og:title", content: "Login Log — Control Room Manager" },
    { property: "og:description", content: "Every staff sign-in, for UK GDPR accountability." },
  ] }),
  component: Page,
});

function Page() {
  const { data = [] } = useQuery({ queryKey: ["logins"], queryFn: async () => (await supabase.from("staff_login_logs").select("*").order("login_at", { ascending: false }).limit(500)).data ?? [] });
  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto">
      <h1 className="text-3xl font-bold mb-6">Login Log</h1>
      <div className="bg-card border rounded-xl overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/60 text-left"><tr>{["When","Name","Email","Role"].map((h) => <th key={h} className="px-3 py-2.5">{h}</th>)}</tr></thead>
        <tbody>{data.map((r) => <tr key={r.id} className="border-t">{[r.login_at, r.user_name, r.email, r.role].map((v, i) => <td key={i} className="px-3 py-2">{fmt(v)}</td>)}</tr>)}</tbody></table></div>
    </div>
  );
}
