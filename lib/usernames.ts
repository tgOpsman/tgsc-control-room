// Staff created by an admin sign in with a username. Supabase Auth needs an email,
// so each username maps to a fixed internal address that never receives mail.
export const USER_DOMAIN = "staff.tgsc.local";
export const normUsername = (u: string) => u.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
export const loginEmail = (input: string) => {
  const v = input.trim();
  return v.includes("@") ? v.toLowerCase() : `${normUsername(v)}@${USER_DOMAIN}`;
};
export const isInternalEmail = (e?: string | null) => !!e && e.endsWith(`@${USER_DOMAIN}`);
export const STAFF_ROLES = ["admin", "manager", "security", "kiosk", "patrol", "cleaner", "user"] as const;
export const STAFF_TEMPLATE_HEADERS = ["username", "temporary_password", "first_name", "last_name", "role", "email"];
export type StaffRow = { username: string; temporary_password: string; first_name: string; last_name: string; role: string; email?: string };
export function staffRowProblem(r: StaffRow): string | null {
  if (!normUsername(r.username || "") || normUsername(r.username) !== r.username.trim().toLowerCase()) return "Username may only use letters, numbers, . _ -";
  if ((r.temporary_password || "").length < 8) return "Temporary password must be at least 8 characters";
  if (!r.first_name?.trim() || !r.last_name?.trim()) return "First and last name are required";
  if (!(STAFF_ROLES as readonly string[]).includes((r.role || "").trim().toLowerCase())) return `Role must be one of: ${STAFF_ROLES.join(", ")}`;
  return null;
}
