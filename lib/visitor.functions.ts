import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cleanText, QR_RATE_LIMIT, visitorSchema } from "./visitor";
import { dailyRef } from "./refs";

// Public (no sign-in) endpoints for the QR poster. Every call must carry the site's secret
// QR key; they only ever write one visitor record or return public shop names.
async function admin() { return (await import("@/integrations/supabase/client.server")).supabaseAdmin; }
async function roomFor(token: string) {
  const sb = await admin();
  const { data } = await sb.from("control_rooms").select("id,name").eq("checkin_token" as "id", token).maybeSingle();
  if (!data) throw new Error("This QR code is no longer valid. Please ask at the control room.");
  return data;
}

export const getVisitorSite = createServerFn({ method: "GET" })
  .inputValidator((i: { room: string }) => z.object({ room: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const room = await roomFor(data.room);
    const { data: t } = await (await admin()).from("tenants").select("name").eq("control_room_id", room.id).eq("is_active", true).order("name").limit(500);
    return { site: room.name, tenants: (t ?? []).map((r) => r.name) };
  });

export const visitorCheckIn = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => visitorSchema.parse(i))
  .handler(async ({ data }) => {
    if (data.website) throw new Error("Rejected");
    const room = await roomFor(data.room);
    const sb = await admin();
    const since = new Date(Date.now() - 10 * 60e3).toISOString();
    const { count: recent } = await sb.from("check_in_records").select("id", { count: "exact", head: true }).eq("control_room_id", room.id).eq("extra->>source", "qr").gte("check_in_time", since);
    if ((recent ?? 0) >= QR_RATE_LIMIT) throw new Error("Too many check-ins right now. Please ask at the control room.");
    const d = new Date(); d.setHours(0, 0, 0, 0);
    const { count } = await sb.from("check_in_records").select("id", { count: "exact", head: true }).eq("control_room_id", room.id).gte("check_in_time", d.toISOString());
    const booking_ref = dailyRef("VR", new Date(), count ?? 0);
    const token = crypto.randomUUID();
    const { data: row, error } = await sb.from("check_in_records").insert({
      control_room_id: room.id, visit_type: data.visit_type, full_name: cleanText(data.full_name),
      company: cleanText(data.company) || null, destination: cleanText(data.destination) || null,
      access_reason: cleanText(data.access_reason) || null, status: "active", booking_ref, check_in_time: new Date().toISOString(),
      extra: { source: "qr", self_service: true, phone: cleanText(data.phone), agreed_safety_rules: true, qr_token: token },
    }).select("id").single();
    if (error || !row) throw new Error("Check-in failed. Please ask at the control room.");
    return { id: row.id, ref: booking_ref, token, name: cleanText(data.full_name), site: room.name, type: data.visit_type, company: cleanText(data.company), destination: cleanText(data.destination), issued: new Date().toISOString() };
  });

export const visitorCheckOut = createServerFn({ method: "POST" })
  .inputValidator((i: { id: string; token: string }) => z.object({ id: z.string().uuid(), token: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row } = await sb.from("check_in_records").update({ status: "completed", check_out_time: new Date().toISOString() })
      .eq("id", data.id).eq("extra->>qr_token", data.token).eq("status", "active").select("id").maybeSingle();
    return { ok: !!row };
  });
