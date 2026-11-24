import { db } from "@/lib/db";

export type ContactTenant = { id: string; name: string; control_room_id: string };
export type Contact = { id: string; name: string; role: string | null; phone: string | null; email: string | null; notes: string | null };
export type ContactValues = { name: string; role: string; phone: string; email: string; notes: string };

export async function saveTenantContact(tenant: ContactTenant, values: ContactValues, contactId?: string) {
  const payload = {
    name: values.name.trim(),
    role: values.role.trim() || null,
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    notes: values.notes.trim() || null,
    tenant_id: tenant.id,
    control_room_id: tenant.control_room_id,
  };
  if (!payload.name) throw new Error("Enter the contact's name.");
  const query = db("out_of_hours_contacts");
  const result = contactId
    ? await query.update(payload).eq("id", contactId).eq("tenant_id", tenant.id).eq("control_room_id", tenant.control_room_id).select("id").single()
    : await query.insert(payload).select("id").single();
  if (result.error) throw result.error;
}

export async function deleteTenantContact(tenant: ContactTenant, contactId: string) {
  const { error } = await db("out_of_hours_contacts").delete()
    .eq("id", contactId).eq("tenant_id", tenant.id).eq("control_room_id", tenant.control_room_id).select("id").single();
  if (error) throw error;
}