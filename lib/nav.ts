import { MODULES } from "./modules";
export type NavItem = { label: string; path: string; group: "top" | "activity" | "logs" | "admin"; roles: string[] };
const MGR = ["admin", "manager"];
const ALL = ["admin", "manager", "security", "user", "patrol"];
const hidden = new Set(["/keys/inventory", "/equipment/inventory", "/contractors", "/out-of-hours", "/bomb-threats", "/team-members"]);
export const NAV: NavItem[] = [
  { label: "Home", path: "/", group: "top", roles: [...ALL, "cleaner"] },
  { label: "Dashboard", path: "/dashboard", group: "top", roles: MGR },
  { label: "RED HAT", path: "/red-hat", group: "top", roles: ALL },
  { label: "Kiosk", path: "/kiosk", group: "activity", roles: ["admin", "manager", "security", "kiosk"] },
  { label: "Incident Assistant", path: "/incident-assistant", group: "activity", roles: ALL },
  { label: "Tablet Check-In", path: "/tablet-checkin", group: "activity", roles: ["admin", "manager", "security", "kiosk"] },
  { label: "User Guide", path: "/user-guide", group: "activity", roles: [...ALL, "kiosk", "cleaner"] },
  { label: "Workplace Bookings", path: "/bookings", group: "activity", roles: ALL },
  ...MODULES.filter((m) => !hidden.has(m.path)).map((m) => ({ label: m.title, path: m.path, group: m.group, roles: m.roles })),
  { label: "Compliance Pack", path: "/compliance-pack", group: "admin", roles: MGR },
  { label: "Site Reports", path: "/site-reports", group: "admin", roles: MGR },
  { label: "Quarterly Archive", path: "/quarterly-archive", group: "admin", roles: MGR },
  { label: "Visit History", path: "/history", group: "admin", roles: MGR },
  { label: "User Directory", path: "/users", group: "admin", roles: ["admin"] },
  { label: "Access Requests", path: "/access-requests", group: "admin", roles: ["admin"] },
  { label: "Login Log", path: "/login-log", group: "admin", roles: MGR },
  { label: "GDPR Audit Trail", path: "/audit-log", group: "admin", roles: MGR },
  { label: "Import Base44 Data", path: "/import", group: "admin", roles: ["admin"] },
];
export const GROUPS = [
  { id: "activity", label: "Daily Control Activity" },
  { id: "logs", label: "Logs & Equipment" },
  { id: "admin", label: "Administration" },
] as const;
