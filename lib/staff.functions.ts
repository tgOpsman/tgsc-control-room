import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { loginEmail, normUsername, staffRowProblem, type StaffRow } from "./usernames";

export const createStaffAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { rows: StaffRow[] }) => {
    if (!Array.isArray(input?.rows) || input.rows.length > 200) throw new Error("Send 1–200 rows");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only admins can create staff accounts");
    const { data: room } = await context.supabase.rpc("current_room");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const results: { username: string; ok: boolean; error?: string }[] = [];
    for (const r of data.rows) {
      const username = normUsername(r.username || "");
      const problem = staffRowProblem(r);
      if (problem) { results.push({ username, ok: false, error: problem }); continue; }
      const first = r.first_name.trim(), last = r.last_name.trim();
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: loginEmail(username),
        password: r.temporary_password,
        email_confirm: true,
        user_metadata: { username, first_name: first, last_name: last, full_name: `${first} ${last}`, contact_email: r.email?.trim() || null, must_complete_profile: true },
      });
      if (error || !created.user) { results.push({ username, ok: false, error: error?.message?.includes("already") ? "Username already taken" : error?.message ?? "Failed" }); continue; }
      const id = created.user.id;
      await supabaseAdmin.from("profiles").upsert({ id, full_name: `${first} ${last}`, email: r.email?.trim() || null });
      await supabaseAdmin.from("user_roles").delete().eq("user_id", id);
      await supabaseAdmin.from("user_roles").insert({ user_id: id, role: r.role.trim().toLowerCase() as "user" });
      if (room) await supabaseAdmin.from("control_room_members").insert({ user_id: id, control_room_id: room });
      results.push({ username, ok: true });
    }
    return { results };
  });

export const resetStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; password: string }) => {
    if (typeof input?.userId !== "string" || !/^[0-9a-f-]{36}$/i.test(input.userId)) throw new Error("Invalid user");
    if (typeof input.password !== "string" || input.password.length < 8) throw new Error("Password must be at least 8 characters");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only admins can reset passwords");
    if (data.userId === context.userId) throw new Error("Use your own profile to change your password");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error: ge } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (ge || !u.user) throw new Error("User not found");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
      user_metadata: { ...(u.user.user_metadata ?? {}), must_complete_profile: true },
    });
    if (error) throw new Error("Could not reset password");
    return { ok: true, username: (u.user.user_metadata?.["username"] as string | undefined) ?? u.user.email ?? "" };
  });

export const completeFirstLoginProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { first_name: string; last_name: string; phone: string; job_title: string; contact_email?: string; password: string }) => {
    const s = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const out = { first_name: s(input?.first_name), last_name: s(input?.last_name), phone: s(input?.phone, 40), job_title: s(input?.job_title), contact_email: s(input?.contact_email, 254), password: typeof input?.password === "string" ? input.password : "" };
    if (!out.first_name || !out.last_name || !out.phone || !out.job_title) throw new Error("Please fill in all required fields");
    if (out.password.length < 8 || out.password.length > 72) throw new Error("New password must be 8–72 characters");
    return out;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error: ge } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (ge || !u.user) throw new Error("Account not found");
    const meta = (u.user.user_metadata ?? {}) as Record<string, unknown>;
    if (meta["must_complete_profile"] !== true) throw new Error("Profile already completed — change your password from your account instead");
    const full_name = `${data.first_name} ${data.last_name}`;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.password,
      user_metadata: { ...meta, first_name: data.first_name, last_name: data.last_name, full_name, phone: data.phone, contact_email: data.contact_email || null, job_title: data.job_title, must_complete_profile: false },
    });
    if (error) throw new Error(error.message.toLowerCase().includes("different") ? "Choose a password different from the temporary one" : error.message);
    await supabaseAdmin.from("profiles").update({ full_name, email: data.contact_email || null }).eq("id", context.userId);
    return { ok: true };
  });
