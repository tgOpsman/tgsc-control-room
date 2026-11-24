import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/galleries-logo.png.asset.json";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/request-access")({
  head: () => ({ meta: [
    { title: "Request access — Control Room Manager" },
    { name: "description", content: "Ask the control room admin for an account." },
    { property: "og:title", content: "Request access — Control Room Manager" },
    { property: "og:description", content: "Ask the control room admin for an account." },
  ] }),
  component: RequestAccess,
});

function RequestAccess() {
  const [f, setF] = useState({ full_name: "", email: "", company: "", reason: "" });
  const [done, setDone] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("access_requests").insert(f);
    if (error) { toast.error(error.message); return; }
    setDone(true);
  };
  return (
    <div className="min-h-screen grid place-items-center bg-sidebar p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-card rounded-2xl p-8 space-y-3">
        <img src={logo.url} alt="The Galleries" className="mx-auto h-10 w-auto mb-2" />
        <h1 className="text-xl font-bold">Request access</h1>
        {done ? <p className="text-sm">Thanks — an admin will review your request.</p> : <>
          <Input placeholder="Full name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} required />
          <Input type="email" placeholder="Work email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
          <Input placeholder="Company" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
          <Textarea placeholder="Reason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Send request</Button>
        </>}
        <Link to="/auth" className="block text-center text-sm underline">Back to sign in</Link>
      </form>
    </div>
  );
}
