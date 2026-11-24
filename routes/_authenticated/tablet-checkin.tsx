import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { insertOrQueue } from "@/lib/offline-queue";
import { dailyRef } from "@/lib/refs";
import { TenantAutocomplete } from "@/components/app/TenantAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/tablet-checkin")({
  head: () => ({
    meta: [
      { title: "Tablet Check-In — Control Room Manager" },
      { name: "description", content: "Self-service visitor check-in for the reception tablet." },
      { property: "og:title", content: "Tablet Check-In — Control Room Manager" },
      { property: "og:description", content: "Self-service visitor check-in for the reception tablet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tablet,
});

const empty = { visit_type: "Visitor", full_name: "", company: "", destination: "", access_reason: "" };
function Tablet() {
  const [v, setV] = useState(empty);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof empty, x: string) => setV((s) => ({ ...s, [k]: x }));
  const submit = async () => {
    if (!v.full_name.trim()) { toast.error("Please enter your name"); return; }
    setBusy(true);
    const d = new Date(); d.setHours(0, 0, 0, 0);
    const { count } = navigator.onLine ? await db("check_in_records").select("id", { count: "exact", head: true }).gte("check_in_time", d.toISOString()).then((r: { count: number | null }) => r, () => ({ count: null })) : { count: null };
    const booking_ref = count == null ? `OFF-${Date.now().toString(36).toUpperCase()}` : dailyRef("", new Date(), count);
    const { error } = await insertOrQueue("check_in_records", { ...v, company: v.company || null, destination: v.destination || null, access_reason: v.access_reason || null, status: "active", booking_ref, check_in_time: new Date().toISOString(), extra: { self_service: true } });
    setBusy(false);
    if (error) { toast.error("Sorry, that didn't work — please ask at the control room."); return; }
    setDone(v.full_name); setV(empty);
    setTimeout(() => setDone(null), 6000);
  };
  if (done) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-8">
      <div className="text-4xl font-bold mb-3">Welcome, {done}</div>
      <p className="text-lg text-muted-foreground">You're checked in. Please wait at reception for your host.</p>
      <Button size="lg" className="mt-8" onClick={() => setDone(null)}>Done</Button>
    </div>
  );
  return (
    <div className="max-w-xl mx-auto p-6 md:p-10">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Welcome</h1>
      <p className="text-center text-muted-foreground mb-6">Please check in below</p>
      <div className="grid grid-cols-3 gap-2 mb-5">{["Visitor", "Contractor", "Agency"].map((t) => <Button key={t} size="lg" variant={v.visit_type === t ? "default" : "outline"} onClick={() => set("visit_type", t)}>{t}</Button>)}</div>
      <div className="space-y-4 text-lg">
        <div><Label className="text-base">Your full name *</Label><Input className="h-12 text-lg" value={v.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
        <div><Label className="text-base">Company</Label><Input className="h-12 text-lg" value={v.company} onChange={(e) => set("company", e.target.value)} /></div>
        <div><Label className="text-base">Who are you visiting?</Label><TenantAutocomplete value={v.destination} onChange={(x) => set("destination", x)} /></div>
        <div><Label className="text-base">Reason for visit</Label><Input className="h-12 text-lg" value={v.access_reason} onChange={(e) => set("access_reason", e.target.value)} /></div>
        <Button size="lg" disabled={busy} className="w-full h-14 text-lg bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>{busy ? "Checking in…" : "Check in"}</Button>
        <Button variant="ghost" className="w-full" onClick={() => document.documentElement.requestFullscreen?.()}>Full screen</Button>
      </div>
    </div>
  );
}
