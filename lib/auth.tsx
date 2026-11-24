import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  user: User | null;
  roles: string[];
  role: string;
  hasRoom: boolean;
  name: string;
  pages: string[];
  loading: boolean;
  refresh: () => Promise<void>;
};
const Ctx = createContext<AuthState>({ user: null, roles: [], role: "user", hasRoom: false, name: "", pages: [], loading: true, refresh: async () => {} });

const ORDER = ["admin", "manager", "security", "patrol", "kiosk", "cleaner", "user"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, "refresh">>({ user: null, roles: [], role: "user", hasRoom: false, name: "", pages: [], loading: true });
  const load = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return setState((s) => ({ ...s, user: null, loading: false }));
    const [r, m, p] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("control_room_members").select("id").eq("user_id", user.id),
      supabase.from("profiles").select("full_name,page_permissions").eq("id", user.id).maybeSingle(),
    ]);
    const roles = (r.data ?? []).map((x) => x.role as string);
    const role = ORDER.find((o) => roles.includes(o)) ?? "user";
    setState({ user, roles, role, hasRoom: (m.data ?? []).length > 0, name: p.data?.full_name || user.email || "", pages: p.data?.page_permissions ?? [], loading: false });
  };
  useEffect(() => { load(); }, []);
  return <Ctx.Provider value={{ ...state, refresh: load }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
// Page permissions only narrow what a role already allows; an empty list means the role defaults.
export const canSee = (role: string, roles: string[], pages: string[] = [], path?: string) => {
  if (role === "admin") return true;
  if (!roles.includes(role)) return false;
  if (path === "/counter-terrorism" && (role === "security" || role === "manager")) return true;
  return !pages.length || !path || path === "/" || pages.includes(path);
};
