export const THREAT_LEVELS = ["Low", "Moderate", "Substantial", "Severe", "Critical"] as const;

export type ThreatSyncAction = "insert" | "unchanged" | "unavailable";

/** Decide what a GOV.UK check should do: only record a level that actually changed. */
export function threatSyncAction(fetched: string | null, latest: string | null): ThreatSyncAction {
  if (!fetched) return "unavailable";
  return fetched === latest ? "unchanged" : "insert";
}

/** Pulls the national threat level out of the GOV.UK "terrorism and national emergencies" page text. */
export function parseThreatLevel(text: string): string | null {
  const m = /threat to the UK[^.]{0,120}?from terrorism is\s+(low|moderate|substantial|severe|critical)/i.exec(text);
  if (!m?.[1]) return null;
  const w = m[1].toLowerCase();
  return THREAT_LEVELS.find((l) => l.toLowerCase() === w) ?? null;
}
