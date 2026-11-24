export const SHIFT_HOURS: Record<string, number> = { D: 12, N: 12, E: 10, B: 10, M: 8, L: 9, SD: 10, SB: 8 };
export const SHIFT_CODES = [...Object.keys(SHIFT_HOURS), "OFF", "HOL", "SICK"];
export const shiftHours = (code?: string | null) => (code ? SHIFT_HOURS[code] ?? 0 : 0);
export const DEPTS = ["Operations Manager", "Dual Service Manager", "Security", "Cleaning", "Agency"] as const;
export function deptOf(roleGroup?: string | null, team?: string | null): string {
  if (roleGroup === "Operations Manager" || roleGroup === "Dual Service Manager" || roleGroup === "Agency") return roleGroup;
  if (roleGroup === "Cleaning" || team === "Cleaning") return "Cleaning";
  return "Security";
}
export type HoursRow = { dept: string; hours: number };
export function hoursSummary(rows: HoursRow[]) {
  const out: Record<string, number> = { Total: 0 };
  for (const d of DEPTS) out[d] = 0;
  for (const r of rows) { out[r.dept] = (out[r.dept] ?? 0) + r.hours; out["Total"] = (out["Total"] ?? 0) + r.hours; }
  return out;
}
export const TRAINING_SECTIONS: Record<string, number> = { "Controller/Dual Service": 12, Cleaning: 4 };
export function trainingProgress(programme: string, competentSections: string[]) {
  const total = TRAINING_SECTIONS[programme] ?? 0;
  if (!total) return 0;
  return Math.round((new Set(competentSections).size / total) * 100);
}
