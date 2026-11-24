import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchUkThreatLevel } from "@/lib/threat.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RotateCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { threatSyncAction } from "@/lib/threat";

export const LEVELS = ["Low", "Moderate", "Substantial", "Severe", "Critical"] as const;
const TONE: Record<string, string> = {
  Low: "bg-success text-success-foreground", Moderate: "bg-success/70 text-success-foreground",
  Substantial: "bg-warning text-warning-foreground", Severe: "bg-accent text-accent-foreground", Critical: "bg-destructive text-destructive-foreground",
};

export function useThreatLevel() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase.channel(`threat-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "threat_levels" }, () => qc.invalidateQueries({ queryKey: ["threat"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  return useQuery({ queryKey: ["threat"], queryFn: async () => (await db("threat_levels").select("*").order("set_at", { ascending: false }).limit(20)).data ?? [] });
}

/** Checks GOV.UK now and records the level only when it differs from the latest one. */
export function useUkThreatSync() {
  const fetchLevel = useServerFn(fetchUkThreatLevel);
  const qc = useQueryClient();
  const [checking, setChecking] = useState(false);
  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      const { level } = await fetchLevel();
      const { data } = await db("threat_levels").select("level").order("set_at", { ascending: false }).limit(1);
      const action = threatSyncAction(level, data?.[0]?.level ?? null);
      if (action === "unavailable") { toast.error("Couldn't read the threat level from GOV.UK"); return "unavailable" as const; }
      if (action === "unchanged") { toast.success(`Threat level is still ${level}`, { description: "Checked against GOV.UK just now." }); return "unchanged" as const; }
      const { error } = await db("threat_levels").insert({ level, set_by: "GOV.UK (automatic)" });
      if (error) { toast.error("Couldn't save the new threat level"); return "unavailable" as const; }
      toast.info(`UK threat level updated to ${level}`);
      qc.invalidateQueries({ queryKey: ["threat"] });
      return "insert" as const;
    } catch {
      toast.error("Couldn't reach GOV.UK");
      return "unavailable" as const;
    } finally {
      setChecking(false);
    }
  }, [fetchLevel, qc]);
  return { refresh, checking };
}

/** Once per sign-in session, records the official GOV.UK level if it differs from the latest recorded one. */
export function useSyncUkThreatLevel(enabled: boolean) {
  const { refresh } = useUkThreatSync();
  const started = useRef(false);
  useEffect(() => {
    if (!enabled || started.current || sessionStorage.getItem("threat-synced")) return;
    started.current = true;
    sessionStorage.setItem("threat-synced", "1");
    void refresh().then((r) => { if (r === "unavailable") sessionStorage.removeItem("threat-synced"); });
  }, [enabled, refresh]);
}

export function ThreatLevelBadge() {
  const { data = [] } = useThreatLevel();
  const { refresh, checking } = useUkThreatSync();
  const level: string = data[0]?.level ?? "Substantial";
  return (
    <span className={`rounded-xl p-5 block ${TONE[level]}`}>
      <span className="flex items-start justify-between gap-2">
        <span className="text-2xl font-bold">{level.toUpperCase()}</span>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={checking}
          aria-label="Check GOV.UK for a new threat level"
          title="Check GOV.UK now"
          className="shrink-0 rounded-lg border border-current/25 p-1.5 opacity-80 hover:opacity-100 disabled:opacity-50"
        >
          <RotateCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
        </button>
      </span>
      <span className="text-sm opacity-90 block">UK threat level · {data[0] ? "from GOV.UK" : "waiting for GOV.UK"}</span>
    </span>
  );
}
