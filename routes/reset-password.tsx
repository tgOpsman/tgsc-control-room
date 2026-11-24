import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/galleries-logo.png.asset.json";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset password — Control Room Manager" },
    { name: "description", content: "Choose a new password for your control room account." },
    { property: "og:title", content: "Reset password — Control Room Manager" },
    { property: "og:description", content: "Choose a new password for your control room account." },
  ] }),
  component: Reset,
});

function Reset() {
  const nav = useNavigate();
  const [p, setP] = useState(""); const [c, setC] = useState("");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (p !== c) { toast.error("Passwords don't match"); return; }
    const { error } = await supabase.auth.updateUser({ password: p });
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated"); nav({ to: "/" });
  };
  return (
    <div className="min-h-screen grid place-items-center bg-sidebar p-4">
      <form onSubmit={save} className="w-full max-w-sm bg-card rounded-2xl p-8 space-y-4">
        <img src={logo.url} alt="The Galleries" className="mx-auto h-10 w-auto mb-2" />
        <h1 className="text-xl font-bold">Set a new password</h1>
        <Input type="password" minLength={8} placeholder="New password" value={p} onChange={(e) => setP(e.target.value)} required />
        <Input type="password" minLength={8} placeholder="Confirm password" value={c} onChange={(e) => setC(e.target.value)} required />
        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Update password</Button>
      </form>
    </div>
  );
}
