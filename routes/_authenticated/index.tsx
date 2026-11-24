import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { useAuth, canSee } from "@/lib/auth";
import { NAV } from "@/lib/nav";
import { ThreatLevelBadge } from "@/components/app/ThreatLevel";
import { WeeklyVisitsChart } from "@/components/app/WeeklyVisitsChart";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Control Room Manager" },
      { name: "description", content: "Live overview of vehicles, people and patrols on site at The Galleries." },
      { property: "og:title", content: "Control Room Manager" },
      { property: "og:description", content: "Live overview of vehicles, people and patrols on site at The Galleries." },
    ],
  }),
  component: Home,
});

const hours = (d: string) => (Date.now() - new Date(d).getTime()) / 3.6e6;

function Home() {
  const { name, role, pages } = useAuth();
  const { data } = useQuery({
    queryKey: ["home"],
    refetchInterval: 30000,
    queryFn: async () => {
      const [v, p, pa, k, ct, rd, ka, w, oos] = await Promise.all([
        db("vehicle_visits").select("id").eq("status", "active"),
        db("check_in_records").select("id").eq("status", "active"),
        db("car_park_patrols").select("id,patrol_start").eq("status", "active"),
        db("key_logs").select("id,issued_at").eq("status", "out"),
        db("ct_incidents").select("id").in("status", ["active", "monitoring"]),
        db("radon_tests").select("id").eq("status", "action_level_exceeded"),
        db("key_audits").select("id").eq("status", "issues_outstanding"),
        db("weather_logs").select("outside_temp,weather").order("logged_at", { ascending: false }).limit(1),
        db("contractor_callouts").select("id,extra").neq("status", "resolved"),
      ]);
      const items: { label: string; path: string }[] = [];
      const ok = (k.data ?? []).filter((x: any) => hours(x.issued_at) >= 24);
      if (ok.length) items.push({ label: `${ok.length} key(s) signed out over 24 hours`, path: "/keys" });
      const sp = (pa.data ?? []).filter((x: any) => hours(x.patrol_start) >= 12);
      if (sp.length) items.push({ label: `${sp.length} patrol(s) left open over 12 hours`, path: "/car-park-patrol" });
      if (ct.data?.length) items.push({ label: `${ct.data.length} active counter terrorism incident(s)`, path: "/counter-terrorism" });
      if (rd.data?.length) items.push({ label: `${rd.data.length} radon test(s) over the action level`, path: "/radon-monitoring" });
      if (ka.data?.length) items.push({ label: `${ka.data.length} key audit(s) with outstanding issues`, path: "/keys/audit" });
      const out = (oos.data ?? []).filter((x: any) => x.extra?.out_of_service);
      if (out.length) items.push({ label: `${out.length} piece(s) of equipment out of service`, path: "/callout-log" });
      return { weather: w.data?.[0], vehicles: v.data?.length ?? 0, people: p.data?.length ?? 0, patrols: pa.data?.length ?? 0, items };
    },
  });
  const tiles = NAV.filter((n) => n.group !== "top" && n.group !== "admin" && canSee(role, n.roles, pages, n.path));
  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {name.split(" ")[0]}</h1>
        <p className="text-muted-foreground">The Galleries Shopping Centre · Control Room</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[["Vehicles on site", data?.vehicles, "/checkin"], ["People on site", data?.people, "/site-checkin"], ["Active patrols", data?.patrols, "/car-park-patrol"]].map(([l, n, p]) => (
          <Link key={l as string} to={p as "/"} className="bg-primary text-primary-foreground rounded-xl p-5 hover:opacity-95">
            <div className="text-4xl font-bold font-mono">{n ?? "–"}</div>
            <div className="text-sm opacity-80 mt-1">{l}</div>
          </Link>
        ))}
        <Link to="/weather-log" className="rounded-xl p-5 bg-card border hover:border-accent">
          <div className="text-2xl font-bold font-mono">{data?.weather?.outside_temp != null ? `${data.weather.outside_temp}°C` : "–"}</div>
          <div className="text-sm text-muted-foreground mt-1">{data?.weather?.weather ?? "No weather logged"}</div>
        </Link>
        <ThreatLevelBadge />
      </div>
      <WeeklyVisitsChart />
      {data && (data.items.length ? (
        <div className="rounded-xl border border-warning/50 bg-warning/10 p-4 space-y-2">
          <div className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Needs attention</div>
          {data.items.map((i) => <Link key={i.label} to={i.path as "/"} className="block text-sm underline-offset-2 hover:underline">{i.label}</Link>)}
        </div>
      ) : (
        <div className="rounded-xl border bg-success/10 border-success/40 p-4 text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Nothing needs your attention right now.</div>
      ))}
      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/red-hat" className="rounded-xl p-6 bg-destructive text-destructive-foreground"><div className="text-xl font-bold">RED HAT — Evacuation</div><div className="text-sm opacity-90">Start an evacuation and run the live muster roll.</div></Link>
        <div className="rounded-xl p-6 bg-card border"><div className="text-xl font-bold">Counter Terrorism</div><div className="text-sm text-muted-foreground mt-2 flex gap-4"><Link to="/counter-terrorism" className="underline">New CT incident</Link><Link to="/bomb-threats" className="underline">New bomb threat</Link></div></div>
      </div>
      <div>
        <h2 className="font-semibold mb-3">Quick access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {tiles.map((t) => (
            <Link key={t.path} to={t.path as "/"} className={`rounded-lg p-4 border bg-card hover:border-accent hover:shadow-sm text-sm font-medium ${t.group === "activity" ? "border-l-4 border-l-primary" : "border-l-4 border-l-accent"}`}>{t.label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
