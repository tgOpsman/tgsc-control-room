import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { deleteTenantContact, saveTenantContact, type Contact, type ContactTenant, type ContactValues } from "@/lib/tenant-contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Tenant = ContactTenant;
const emptyValues: ContactValues = { name: "", role: "", phone: "", email: "", notes: "" };

export function tenantContactsQuery(tenant: Tenant) {
  return {
    queryKey: ["tenant-contacts", tenant.control_room_id, tenant.id],
    queryFn: async (): Promise<Contact[]> => {
      const { data, error } = await db("out_of_hours_contacts")
        .select("id,name,role,phone,email,notes")
        .eq("tenant_id", tenant.id)
        .eq("control_room_id", tenant.control_room_id)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  };
}

export function TenantContacts({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  const { role } = useAuth();
  const qc = useQueryClient();
  const { data: contacts = [], isPending, isError, refetch } = useQuery(tenantContactsQuery(tenant));
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const [values, setValues] = useState<ContactValues>(emptyValues);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canDelete = role === "admin" || role === "manager";
  const startEdit = (contact: Contact | "new") => {
    setEditing(contact);
    setError("");
    setValues(contact === "new" ? emptyValues : {
      name: contact.name, role: contact.role ?? "", phone: contact.phone ?? "", email: contact.email ?? "", notes: contact.notes ?? "",
    });
  };
  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: tenantContactsQuery(tenant).queryKey }),
      qc.invalidateQueries({ queryKey: ["mod", "out_of_hours_contacts"] }),
    ]);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || busy) return;
    setBusy(true);
    setError("");
    try {
      await saveTenantContact(tenant, values, editing === "new" ? undefined : editing.id);
      await invalidate();
      setEditing(null);
      toast.success("Contact saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save contact. Please try again.");
    } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleting || busy || !canDelete) return;
    setBusy(true);
    setError("");
    try {
      await deleteTenantContact(tenant, deleting.id);
      await invalidate();
      setDeleting(null);
      toast.success("Contact deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete contact. Please try again.");
    } finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6 break-words">{tenant.name}</DialogTitle>
          <DialogDescription>{editing ? editing === "new" ? "Add out-of-hours contact" : "Edit out-of-hours contact" : "Out-of-hours contacts"}</DialogDescription>
        </DialogHeader>
        {editing ? (
          <form onSubmit={save} className="space-y-4">
            <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2 min-w-0">
              <div><Label htmlFor="contact-name" className="mb-1.5 block">Name *</Label><Input id="contact-name" required autoFocus value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></div>
              <div><Label htmlFor="contact-role" className="mb-1.5 block">Role</Label><Input id="contact-role" value={values.role} onChange={(e) => setValues({ ...values, role: e.target.value })} /></div>
              <div><Label htmlFor="contact-phone" className="mb-1.5 block">Phone</Label><Input id="contact-phone" type="tel" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} /></div>
              <div><Label htmlFor="contact-email" className="mb-1.5 block">Email</Label><Input id="contact-email" type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label htmlFor="contact-notes" className="mb-1.5 block">Notes</Label><Textarea id="contact-notes" value={values.notes} onChange={(e) => setValues({ ...values, notes: e.target.value })} /></div>
            </fieldset>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => { setEditing(null); setError(""); }}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save contact"}</Button></DialogFooter>
          </form>
        ) : deleting ? (
          <div className="space-y-4">
            <p className="text-sm break-words">Delete {deleting.name} from this store’s out-of-hours contacts? The deletion is kept in the audit trail.</p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter><Button variant="outline" disabled={busy} onClick={() => { setDeleting(null); setError(""); }}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete contact"}</Button></DialogFooter>
          </div>
        ) : <>
        {isPending ? <p className="py-6 text-sm text-muted-foreground" role="status">Loading contacts…</p>
          : isError ? <div className="space-y-3 py-4"><p role="alert" className="text-sm text-destructive">Unable to load contacts.</p><Button variant="outline" onClick={() => refetch()}>Try again</Button></div>
          : !contacts.length ? <p className="py-6 text-sm text-muted-foreground">No out-of-hours contacts recorded for this store.</p>
          : <ul className="divide-y">
            {contacts.map((contact) => (
              <li key={contact.id} className="space-y-2 py-4 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="font-semibold break-words">{contact.name}</p>{contact.role && <p className="text-sm text-muted-foreground break-words">{contact.role}</p>}</div>
                  <TooltipProvider><div className="flex shrink-0">
                    <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" aria-label={`Edit ${contact.name}`} onClick={() => startEdit(contact)}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Edit contact</TooltipContent></Tooltip>
                    {canDelete && <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" aria-label={`Delete ${contact.name}`} onClick={() => { setDeleting(contact); setError(""); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></TooltipTrigger><TooltipContent>Delete contact</TooltipContent></Tooltip>}
                  </div></TooltipProvider>
                </div>
                {contact.phone && <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`} className="flex items-start gap-2 text-sm text-primary underline underline-offset-4"><Phone className="h-4 w-4 shrink-0 mt-0.5" /><span className="break-all">{contact.phone}</span></a>}
                {contact.email && <a href={`mailto:${contact.email}`} className="flex items-start gap-2 text-sm text-primary underline underline-offset-4"><Mail className="h-4 w-4 shrink-0 mt-0.5" /><span className="break-all">{contact.email}</span></a>}
                {contact.notes && <p className="text-sm whitespace-pre-wrap break-words text-muted-foreground">{contact.notes}</p>}
              </li>
            ))}
          </ul>}
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={() => startEdit("new")}><Plus className="h-4 w-4" />Add contact</Button></DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
  );
}