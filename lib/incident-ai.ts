export const INCIDENT_CATEGORIES = ["Security / Crime", "Anti-social Behaviour", "Health & Safety", "First Aid / Medical", "Fire Safety", "Spillage / Slip Hazard", "Defect / Facilities", "Car Park / Barrier", "Lost & Found", "Counter Terrorism", "Safeguarding / Vulnerable Person", "Other"] as const;
export const SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;
export const DESTINATIONS = [
  { path: "/defect-reports", label: "Defect Reports" },
  { path: "/spillage-log", label: "Spillage Log" },
  { path: "/cctv-log", label: "CCTV Log" },
  { path: "/counter-terrorism", label: "Counter Terrorism" },
  { path: "/fire-logbook", label: "Fire LogBook" },
  { path: "/barrier-log", label: "Barrier Log" },
  { path: "/found-property", label: "Lost & Found" },
  { path: "/callout-log", label: "Contractor Callouts" },
  { path: "/car-park-patrol", label: "Car Park Patrol" },
] as const;
export type IncidentDraft = {
  title: string; category: string; severity: string; summary: string; location: string; people_involved: string;
  actions: { action: string; priority: string; owner: string }[];
  destination: string;
};
export function draftToText(d: IncidentDraft) {
  return [`${d.title}`, `Category: ${d.category} | Severity: ${d.severity}`, `Location: ${d.location}`, `People involved: ${d.people_involved}`, "", d.summary, "", "Recommended actions:", ...d.actions.map((a, i) => `${i + 1}. [${a.priority}] ${a.action} — ${a.owner}`)].join("\n");
}
