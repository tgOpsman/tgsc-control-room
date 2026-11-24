import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { completeFirstLoginProfile } from "@/lib/staff.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CompleteProfile() {
  const { user, refresh } = useAuth();
  const m = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const [f, setF] = useState({ first_name: m["first_name"] ?? "", last_name: m["last_name"] ?? "", phone: "", contact_email: m["contact_email"] ?? "", job_title: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const complete = useServerFn(completeFirstLoginProfile);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (f.password !== f.confirm) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    try {
      await complete({ data: { first_name: f.first_name, last_name: f.last_name, phone: f.phone, job_title: f.job_title, contact_email: f.contact_email, password: f.password } });
    } catch (err) { setBusy(false); toast.error(err instanceof Error ? err.message : "Could not save"); return; }
    await supabase.auth.refreshSession();
    toast.success("Profile complete — welcome!");
    await refresh(); setBusy(false);
  };
  return (
    <form onSubmit={save} className="max-w-lg mx-auto mt-12 p-8 bg-card border rounded-xl space-y-4">
      <div><h1 className="text-xl font-bold">Complete your profile</h1><p className="text-sm text-muted-foreground">First time signing in — please check your details and choose your own password.</p></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="mb-1.5 block">First name</Label><Input value={f.first_name} onChange={set("first_name")} required /></div>
        <div><Label className="mb-1.5 block">Last name</Label><Input value={f.last_name} onChange={set("last_name")} required /></div>
      </div>
      <div><Label className="mb-1.5 block">Mobile phone</Label><Input type="tel" value={f.phone} onChange={set("phone")} required /></div>
      <div><Label className="mb-1.5 block">Job title</Label><Input value={f.job_title} onChange={set("job_title")} required /></div>
      <div><Label className="mb-1.5 block">Email (optional — lets you reset your own password)</Label><Input type="email" value={f.contact_email} onChange={set("contact_email")} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="mb-1.5 block">New password</Label><Input type="password" autoComplete="new-password" value={f.password} onChange={set("password")} required /></div>
        <div><Label className="mb-1.5 block">Confirm password</Label><Input type="password" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} required /></div>
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">{busy ? "Saving…" : "Save and continue"}</Button>
    </form>
  );
}
