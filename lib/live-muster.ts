import { db } from "@/lib/db";

type LiveRow = {
  id?: string; name?: string; is_active?: boolean; unit_number?: string | null; floor?: string | null;
  contact_phone?: string | null; status?: string; check_out_time?: string | null; archived?: boolean;
  visit_type?: string; full_name?: string; company?: string | null; booking_ref?: string | null;
  badge_number?: string | null; destination?: string | null; driver_name?: string | null;
  licence_plate?: string; driver_company?: string | null; ref?: string | null;
  extra?: { source?: string; source_id?: string; category?: string };
};
export function liveMusterRows(event: { id: string; control_room_id: string }, tenants: LiveRow[], people: LiveRow[], vehicles: LiveRow[], existing: LiveRow[]) {
  const candidates = [
    ...tenants.filter((t) => t.is_active).map((t) => ({
      name: t.name, company: t.unit_number || t.floor || null, ref: t.unit_number || null, people: 0,
      extra: { category: "Occupier", source: "tenants", source_id: t.id, phone: t.contact_phone || null, headcount_unknown: true },
    })),
    ...people.filter((p) => p.status === "active" && !p.check_out_time && !p.archived && p.visit_type !== "RoofAccess").map((p) => ({
      name: p.full_name, company: p.company || null, ref: p.booking_ref || p.badge_number || null, people: 1,
      extra: { category: p.visit_type || "Visitor", source: "check_in_records", source_id: p.id, destination: p.destination || null },
    })),
    ...vehicles.filter((v) => v.status === "active" && !v.check_out_time && !v.archived).map((v) => ({
      name: v.driver_name || v.licence_plate, company: v.driver_company || null, ref: v.licence_plate, people: 1,
      extra: { category: "Vehicle", source: "vehicle_visits", source_id: v.id },
    })),
  ];
  return candidates.filter((candidate) => !existing.some((row) =>
    (row.extra?.source === candidate.extra.source && row.extra?.source_id === candidate.extra.source_id)
    || (!row.extra?.source_id && row.name === candidate.name && (row.ref || null) === candidate.ref && row.extra?.category === candidate.extra.category)
  )).map((row) => ({ ...row, event_id: event.id, control_room_id: event.control_room_id, status: "pending" }));
}

export async function loadLiveMuster(event: { id: string; control_room_id: string }, includeVehicles = false) {
  const room = event.control_room_id;
  const [tenants, people, vehicles, existing] = await Promise.all([
    db("tenants").select("id,name,unit_number,floor,contact_phone,is_active").eq("control_room_id", room).eq("is_active", true),
    db("check_in_records").select("id,full_name,company,visit_type,booking_ref,badge_number,destination,status,check_out_time,archived").eq("control_room_id", room).eq("status", "active").is("check_out_time", null).eq("archived", false).neq("visit_type", "RoofAccess"),
    includeVehicles ? db("vehicle_visits").select("id,driver_name,driver_company,licence_plate,status,check_out_time,archived").eq("control_room_id", room).eq("status", "active").is("check_out_time", null).eq("archived", false) : Promise.resolve({ data: [], error: null }),
    db("muster_records").select("name,ref,extra").eq("control_room_id", room).eq("event_id", event.id),
  ]);
  for (const result of [tenants, people, vehicles, existing]) if (result.error) throw result.error;
  const rows = liveMusterRows(event, tenants.data ?? [], people.data ?? [], vehicles.data ?? [], existing.data ?? []);
  if (rows.length) {
    const { error } = await db("muster_records").insert(rows);
    if (error) throw error;
  }
  return { occupiers: rows.filter((r) => r.extra.category === "Occupier").length, people: rows.filter((r) => r.extra.category !== "Occupier").length };
}