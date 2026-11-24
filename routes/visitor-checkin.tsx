import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { getVisitorSite, visitorCheckIn, visitorCheckOut } from "@/lib/visitor.functions";
import { visitorSchema, VISITOR_TYPES } from "@/lib/visitor";
import logo from "@/assets/galleries-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { IdCard } from "@/components/checkin/IdCard";

export const Route = createFileRoute("/visitor-checkin")({
  validateSearch: (s) => z.object({ room: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Visitor Sign-In — Control Room Manager" },
      { name: "description", content: "Sign in as a visitor or contractor by scanning the site QR code." },
      { property: "og:title", content: "Visitor Sign-In — Control Room Manager" },
      { property: "og:description", content: "Sign in as a visitor or contractor by scanning the site QR code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: VisitorCheckIn,
});

type Pass = { id: string; ref: string; token: string; name: string; site: string; type?: string; company?: string; destination?: string; issued?: string };
const PASS_KEY = "visitor-pass";
const blank = { visit_type: "Visitor" as (typeof VISITOR_TYPES)[number], full_name: "", company: "", destination: "", phone: "", access_reason: "", agreed: false, website: "" };

function VisitorCheckIn() {
  const { room } = Route.useSearch();
  const [site, setSite] = useState<{ site: string; tenants: string[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [v, setV] = useState(blank);
  const [pass, setPass] = useState<Pass | null>(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(false);
  useEffect(() => { try { const p = localStorage.getItem(PASS_KEY); if (p) setPass(JSON.parse(p)); } catch { /* ignore */ } }, []);
  useEffect(() => {
    if (!room) { setErr("Please scan the QR code at the entrance."); return; }
    getVisitorSite({ data: { room } }).then(setSite, () => setErr("This QR code is not valid. Please ask at the control room."));
  }, [room]);
  const set = (k: keyof typeof blank, x: unknown) => setV((s) => ({ ...s, [k]: x }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = visitorSchema.safeParse({ ...v, room });
    if (!parsed.success) { setErr(parsed.error.issues[0]?.message ?? "Check your details"); return; }
    setErr(null); setBusy(true);
    try { const p = await visitorCheckIn({ data: parsed.data }); localStorage.setItem(PASS_KEY, JSON.stringify(p)); setPass(p); }
    catch (x) { setErr((x as Error).message); }
    setBusy(false);
  };
  const checkOut = async () => {
    if (!pass) return; setBusy(true);
    try { await visitorCheckOut({ data: { id: pass.id, token: pass.token } }); localStorage.removeItem(PASS_KEY); setPass(null); setLeft(true); setV(blank); }
    catch { setErr("Could not sign you out — please tell the control room."); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-background p-5">
      <div className="max-w-md mx-auto">
        <div className="flex justify-center mb-5"><img src={logo.url} alt="The Galleries" className="h-12 w-auto" /></div>
        {left ? (
          <div className="bg-card border rounded-xl p-6 text-center"><h1 className="text-2xl font-bold">Thanks for visiting</h1><p className="text-muted-foreground mt-2">You're signed out. Have a safe journey.</p></div>
        ) : pass ? (
          <div className="space-y-3">
            <IdCard pass={pass} logo={logo.url} />
            <Button size="lg" className="w-full h-12" disabled={busy} onClick={checkOut}>{busy ? "Signing out…" : pass.type === "Staff" || pass.type === "Agency" ? "Sign out — end shift" : "Sign out — I'm leaving"}</Button>
            {err && <p className="text-sm text-destructive text-center">{err}</p>}
            <div className="text-sm bg-muted/50 rounded-md p-3 space-y-1">
              <p><b>If the fire alarm sounds:</b> leave by the nearest exit and follow staff in red hats to the assembly point.</p>
              <p>Do not use lifts during an evacuation. Report anything suspicious to security.</p>
            </div>
          </div>
        ) : !site ? (
          <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground">{err ?? "Loading…"}</div>
        ) : (
          <form onSubmit={submit} className="bg-card border rounded-xl p-5 space-y-4">
            <div><h1 className="text-2xl font-bold">Sign in</h1><p className="text-sm text-muted-foreground">{site.site}</p></div>
            <div className="grid grid-cols-2 gap-2">{VISITOR_TYPES.map((t) => <Button key={t} type="button" variant={v.visit_type === t ? "default" : "outline"} onClick={() => set("visit_type", t)}>{t}</Button>)}</div>
            <div><Label>Full name *</Label><Input className="h-11" autoComplete="name" value={v.full_name} onChange={(e) => set("full_name", e.target.value)} maxLength={100} /></div>
            <div><Label>Mobile number *</Label><Input className="h-11" type="tel" autoComplete="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} maxLength={20} /></div>
            <div><Label>{v.visit_type === "Agency" ? "Agency" : "Company"}</Label><Input className="h-11" value={v.company} onChange={(e) => set("company", e.target.value)} maxLength={100} /></div>
            <div><Label>Who are you visiting?</Label><Input className="h-11" list="shops" value={v.destination} onChange={(e) => set("destination", e.target.value)} maxLength={120} />
              <datalist id="shops">{site.tenants.map((t) => <option key={t} value={t} />)}</datalist></div>
            <div><Label>Reason for visit</Label><Input className="h-11" value={v.access_reason} onChange={(e) => set("access_reason", e.target.value)} maxLength={300} /></div>
            <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={v.website} onChange={(e) => set("website", e.target.value)} />
            <Label className="flex items-start gap-2 font-normal"><Checkbox checked={v.agreed} onCheckedChange={(c) => set("agreed", c === true)} className="mt-0.5" /> I will follow the site safety and fire evacuation rules, and sign out when I leave.</Label>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button size="lg" disabled={busy} className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90">{busy ? "Signing in…" : "Sign in"}</Button>
            <p className="text-xs text-muted-foreground">Your details are kept by the control room for site safety and removed in line with UK GDPR.</p>
          </form>
        )}
      </div>
    </div>
  );
}
