import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
const TEMPLATES: Record<string, { subject: string; body: string }> = {
  "Blank": { subject: "", body: "" },
  "Fire alarm test": { subject: "Weekly fire alarm test", body: "Dear {name},\n\nPlease be advised the weekly fire alarm test will take place on [date] at [time]. No action is required.\n\nKind regards,\nControl Room Manager" },
  "Planned works": { subject: "Planned works notice", body: "Dear {name},\n\nPlanned works will take place near unit {unit} on [date]. Please contact the Control Room with any questions.\n\nKind regards,\nControl Room Manager" },
  "Delivery / goods lift": { subject: "Goods lift availability", body: "Dear {name},\n\nGoods lift {lift} will be unavailable on [date]. Please plan deliveries accordingly.\n\nKind regards,\nControl Room Manager" },
};

export function TenantEmail() {
  const [open, setOpen] = useState(false);
  const [tid, setTid] = useState("");
  const [tpl, setTpl] = useState("Blank");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const { data: tenants = [] } = useQuery({ queryKey: ["tenants-mail"], enabled: open, queryFn: async () => (await db("tenants").select("id,name,unit_number,goods_lift_number,contact_name,contact_email").eq("is_active", true).order("name")).data as Row[] });
  const t = tenants.find((x) => x.id === tid);
  const fill = (s: string) => s.replace("{name}", t?.contact_name || t?.name || "").replace("{unit}", t?.unit_number || "").replace("{lift}", t?.goods_lift_number || "");
  const pick = (k: string) => { setTpl(k); setSubject(TEMPLATES[k]?.subject ?? ""); setBody(TEMPLATES[k]?.body ?? ""); };
  const href = t?.contact_email ? `mailto:${t.contact_email}?subject=${encodeURIComponent(fill(subject))}&body=${encodeURIComponent(fill(body))}` : undefined;
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Mail className="h-4 w-4" /> Email a tenant</Button>
      {open && (
        <Dialog open onOpenChange={setOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Email a tenant</DialogTitle></DialogHeader>
            <select aria-label="Tenant" className="border rounded-md px-2 py-2 bg-card" value={tid} onChange={(e) => setTid(e.target.value)}>
              <option value="">Choose tenant…</option>
              {tenants.map((x) => <option key={x.id} value={x.id}>{x.name}{x.unit_number ? ` (${x.unit_number})` : ""}{x.contact_email ? "" : " — no email"}</option>)}
            </select>
            <select aria-label="Template" className="border rounded-md px-2 py-2 bg-card" value={tpl} onChange={(e) => pick(e.target.value)}>
              {Object.keys(TEMPLATES).map((k) => <option key={k}>{k}</option>)}
            </select>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
            <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" />
            <p className="text-xs text-muted-foreground">Opens in your own email program so it's sent from your mailbox.</p>
            <DialogFooter>
              <Button asChild disabled={!href}><a href={href} onClick={() => setOpen(false)}>Open in email</a></Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
