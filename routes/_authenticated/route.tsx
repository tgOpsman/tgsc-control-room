import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider, canSee, useAuth } from "@/lib/auth";
import { GROUPS, NAV } from "@/lib/nav";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { QuickLogMenu } from "@/components/app/QuickLog";
import { SearchPalette } from "@/components/app/SearchPalette";
import { OverdueAlerts } from "@/components/extra/OverdueAlerts";
import { CompleteProfile } from "@/components/team/CompleteProfile";
import { useCallback } from "react";
import { useIdleLogout } from "@/hooks/use-idle-logout";
import { useSyncUkThreatLevel } from "@/components/app/ThreatLevel";
import logo from "@/assets/galleries-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: () => (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  ),
});

function Shell() {
  const { role, pages, name, hasRoom, loading, user } = useAuth();
  const mustComplete = !!user?.user_metadata?.["must_complete_profile"];
  const qc = useQueryClient();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV.filter((n) => canSee(role, n.roles, pages, n.path));
  const signOut = useCallback(async () => {
    await qc.cancelQueries();
    qc.clear();
    sessionStorage.removeItem("threat-synced");
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }, [qc, navigate]);
  useSyncUkThreatLevel(!loading && hasRoom && !mustComplete);
  const idle = useIdleLogout(signOut, !!user && role !== "kiosk");
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground border-b border-sidebar-border print:hidden">
        <div className="max-w-[1500px] mx-auto px-4 h-14 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 mr-4 font-bold text-sidebar-accent-foreground">
            <span className="bg-card rounded-md px-2 py-1 flex items-center"><img src={logo.url} alt="The Galleries" className="h-6 w-auto" /></span>
            <span className="hidden md:inline">Control Room Manager</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {items.filter((i) => i.group === "top").map((i) => (
              <Link key={i.path} to={i.path as "/"} className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap hover:bg-sidebar-accent ${path === i.path ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""} ${i.label === "RED HAT" ? "text-sidebar-primary font-semibold" : ""}`}>{i.label}</Link>
            ))}
            {GROUPS.map((g) => {
              const sub = items.filter((i) => i.group === g.id);
              if (!sub.length) return null;
              return (
                <DropdownMenu key={g.id}>
                  <DropdownMenuTrigger className="px-3 py-1.5 rounded-md text-sm whitespace-nowrap hover:bg-sidebar-accent flex items-center gap-1">
                    {g.label} <ChevronDown className="h-3.5 w-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-[70vh] overflow-y-auto">
                    {sub.map((i) => (
                      <DropdownMenuItem key={i.path} asChild>
                        <Link to={i.path as "/"}>{i.label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <QuickLogMenu />
            <SearchPalette />
            {hasRoom && role !== "kiosk" && role !== "cleaner" && <OverdueAlerts />}
            <div className="hidden lg:block text-right leading-tight">
              <div className="text-sidebar-accent-foreground">{name}</div>
              <div className="text-xs capitalize opacity-70">{role}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={signOut} className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>
      <OfflineBanner />
      {!loading && mustComplete ? <CompleteProfile /> : !loading && !hasRoom ? (
        <div className="max-w-xl mx-auto mt-20 p-8 text-center bg-card border rounded-xl">
          <ShieldAlert className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-xl font-bold">Awaiting access</h1>
          <p className="mt-2 text-muted-foreground text-sm">Your account is set up, but an admin still needs to assign you a role and control room before you can see any records.</p>
        </div>
      ) : (
        <>
          <div className="hidden print:flex items-center justify-between border-b-2 border-accent pb-3 mb-4 px-6">
            <img src={logo.url} alt="The Galleries" className="h-10 w-auto" />
            <div className="text-right text-xs">
              <div className="font-bold text-sm">Control Room Manager</div>
              <div>Generated {new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })}{name ? ` by ${name}` : ""}</div>
            </div>
          </div>
          <Outlet />
        </>
      )}
      {idle.secondsLeft !== null && (
        <div className="fixed inset-0 z-[100] bg-foreground/60 flex items-center justify-center p-4 print:hidden">
          <div className="bg-card border rounded-xl p-6 max-w-sm w-full text-center shadow-lg">
            <div className="text-lg font-bold mb-1">Still there?</div>
            <p className="text-sm text-muted-foreground mb-4">You'll be signed out in {idle.secondsLeft}s because there's been no activity.</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={idle.stay}>Stay signed in</Button>
              <Button variant="outline" onClick={signOut}>Sign out now</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
