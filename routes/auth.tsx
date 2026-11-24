import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginEmail } from "@/lib/usernames";
import logo from "@/assets/galleries-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Sign in — Control Room Manager" },
    { name: "description", content: "Staff sign-in for the Control Room Manager." },
    { property: "og:title", content: "Sign in — Control Room Manager" },
    { property: "og:description", content: "Staff sign-in for the Control Room Manager." },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "forgot">("in");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "forgot") {
        await supabase.auth.resetPasswordForEmail(login.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        toast.success("If an account exists for that email, a reset link is on its way. Staff with only a username should ask an admin.");
      } else {
        const email = loginEmail(login);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message === "Invalid login credentials" ? "Wrong username or password" : error.message);
        const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
        await supabase.from("staff_login_logs").insert({ user_id: data.user.id, email, user_name: data.user.user_metadata?.['full_name'] ?? login, role: r?.[0]?.role ?? "none" });
        nav({ to: "/" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen grid place-items-center bg-sidebar p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-card rounded-2xl p-8 space-y-4 shadow-xl">
        <div className="text-center">
          <img src={logo.url} alt="The Galleries" className="mx-auto h-11 w-auto" />
          <h1 className="mt-3 text-xl font-bold">Control Room Manager</h1>
          <p className="text-sm text-muted-foreground">{mode === "in" ? "Sign in to continue" : "Reset your password"}</p>
        </div>
        <div><Label className="mb-1.5 block">{mode === "in" ? "Username or email" : "Email"}</Label><Input type={mode === "in" ? "text" : "email"} autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} required /></div>
        {mode === "in" && <div><Label className="mb-1.5 block">Password</Label><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>}
        <Button type="submit" disabled={busy} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Send reset link"}</Button>
        <div className="flex justify-between text-sm">
          <Link to="/request-access" className="underline">Request access</Link>
          <button type="button" className="underline" onClick={() => setMode(mode === "in" ? "forgot" : "in")}>{mode === "in" ? "Forgot password?" : "Back to sign in"}</button>
        </div>
      </form>
    </div>
  );
}
