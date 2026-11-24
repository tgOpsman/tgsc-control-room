import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NAV, GROUPS } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { resetStaffPassword } from "@/lib/staff.functions";
import { printSlips, tempPassword } from "@/lib/slips";
import logo from "@/assets/galleries-logo.png.asset.json";
import { StaffAccounts } from "@/components/team/StaffAccounts";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [
    { title: "User Directory — Control Room Manager" },
    { name: "description", content: "Assign staff roles and control rooms." },
    { property: "og:title", content: "User Directory — Control Room Manager" },
    { property: "og:description", content: "Assign staff roles and control rooms." },
  ] }),
  component: Users,
});

const ROLES = ["admin", "manager", "security", "kiosk", "patrol", "cleaner", "user"] as const;

function Users() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const [p, r, m, rooms] = await Promise.all([
        supabase.from("profiles").select("*").order("full_name"),
        supabase.from("user_roles").select("*"),
        supabase.from("control_room_members").select("*"),
        supabase.from("control_rooms").select("*"),
      ]);
      return { profiles: p.data ?? [], roles: r.data ?? [], members: m.data ?? [], rooms: rooms.data ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["users"] });
  const setRole = async (uid: string, role: string) => {
    await supabase.from("user_roles").delete().eq("user_id", uid);
    if (role) {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: role as (typeof ROLES)[number] });
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Role updated"); refresh();
  };
  const toggleRoom = async (uid: string, room: string, on: boolean) => {
    const res = on
      ? await supabase.from("control_room_members").insert({ user_id: uid, control_room_id: room })
      : await supabase.from("control_room_members").delete().eq("user_id", uid).eq("control_room_id", room);
    if (res.error) { toast.error(res.error.message); return; }
    refresh();
  };
  const resetFn = useServerFn(resetStaffPassword);
  const [reset, setReset] = useState<{ id: string; name: string; role: string; password: string; done?: string } | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const doReset = async () => {
    if (!reset) return;
    setResetBusy(true);
    try { const r = await resetFn({ data: { userId: reset.id, password: reset.password } }); setReset({ ...reset, done: r.username.replace(/@staff\.tgsc\.local$/, "") }); toast.success("Password reset"); }
    catch (e) { toast.error((e as Error).message); } finally { setResetBusy(false); }
  };
  const [perm, setPerm] = useState<{ id: string; name: string; role: string; pages: string[] } | null>(null);
  const savePerm = async () => {
    if (!perm) return;
    const { error } = await supabase.from("profiles").update({ page_permissions: perm.pages }).eq("id", perm.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Page access saved"); setPerm(null); refresh();
  };
  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      <h1 className="text-3xl font-bold mb-1">User Directory</h1>
      <p className="text-sm text-muted-foreground mb-4">Create staff accounts with a username and temporary password. On first sign-in they add their details and choose their own password.</p>
      <div className="mb-6"><StaffAccounts onDone={refresh} /></div>
      <div className="bg-card border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left"><tr><th className="px-3 py-2.5">Name</th><th className="px-3 py-2.5">Email</th><th className="px-3 py-2.5">Role</th><th className="px-3 py-2.5">Pages</th><th className="px-3 py-2.5">Password</th>{data?.rooms.map((r) => <th key={r.id} className="px-3 py-2.5">{r.name}</th>)}</tr></thead>
          <tbody>
            {data?.profiles.map((p) => {
              const role = data.roles.find((r) => r.user_id === p.id)?.role ?? "";
              return (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">{p.full_name}</td>
                  <td className="px-3 py-2">{p.email}</td>
                  <td className="px-3 py-2">
                    <select className="border rounded-md px-2 py-1 bg-card" value={role} onChange={(e) => setRole(p.id, e.target.value)}>
                      <option value="">— none —</option>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Button size="sm" variant="outline" disabled={!role || role === "admin"} onClick={() => setPerm({ id: p.id, name: p.full_name ?? p.email ?? "", role, pages: p.page_permissions ?? [] })}>
                      {role === "admin" ? "All" : p.page_permissions?.length ? `${p.page_permissions.length} pages` : "Role default"}
                    </Button>
                  </td>
                  <td className="px-3 py-2"><Button size="sm" variant="outline" onClick={() => setReset({ id: p.id, name: p.full_name ?? p.email ?? "", role, password: tempPassword() })}>Reset</Button></td>
                  {data.rooms.map((r) => {
                    const on = data.members.some((m) => m.user_id === p.id && m.control_room_id === r.id);
                    return <td key={r.id} className="px-3 py-2"><input type="checkbox" checked={on} onChange={(e) => toggleRoom(p.id, r.id, e.target.checked)} /></td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {reset && (
        <Dialog open onOpenChange={(o) => !o && setReset(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reset password — {reset.name}</DialogTitle></DialogHeader>
            {reset.done === undefined ? (
              <>
                <p className="text-sm text-muted-foreground">They'll sign in with this temporary password and must choose a new one straight away.</p>
                <div className="flex gap-2"><input className="flex-1 border rounded-md h-9 px-2 bg-card font-mono" value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} /><Button variant="outline" onClick={() => setReset({ ...reset, password: tempPassword() })}>Generate</Button></div>
                <DialogFooter><Button disabled={resetBusy || reset.password.length < 8} onClick={doReset}>{resetBusy ? "Resetting…" : "Reset password"}</Button></DialogFooter>
              </>
            ) : (
              <>
                <p className="text-sm">Username: <span className="font-mono font-bold">{reset.done}</span><br />Temporary password: <span className="font-mono font-bold">{reset.password}</span></p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { void navigator.clipboard.writeText(reset.password); toast.success("Copied"); }}>Copy password</Button>
                  <Button variant="outline" onClick={() => printSlips([{ username: reset.done ?? "", password: reset.password, name: reset.name, role: reset.role }], logo.url)}>Print slip</Button>
                  <Button onClick={() => setReset(null)}>Done</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
      {perm && (
        <Dialog open onOpenChange={(o) => !o && setPerm(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Page access — {perm.name}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Tick the pages this person may use. Leave all unticked to use the {perm.role} role defaults. You can only narrow what the role allows.</p>
            {GROUPS.map((g) => {
              const items = NAV.filter((n) => n.group === g.id && n.path !== "/" && n.roles.includes(perm.role));
              if (!items.length) return null;
              return (
                <div key={g.id}>
                  <div className="font-semibold text-sm mt-2 mb-1">{g.label}</div>
                  <div className="grid sm:grid-cols-2 gap-1">
                    {items.map((n) => (
                      <label key={n.path} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={perm.pages.includes(n.path)} onChange={(e) => setPerm({ ...perm, pages: e.target.checked ? [...perm.pages, n.path] : perm.pages.filter((x) => x !== n.path) })} />
                        {n.label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPerm({ ...perm, pages: [] })}>Reset to role default</Button>
              <Button onClick={savePerm}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
