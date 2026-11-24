import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createStaffAccounts } from "@/lib/staff.functions";
import { parseCsv } from "@/lib/csv";
import { STAFF_ROLES, STAFF_TEMPLATE_HEADERS, staffRowProblem, type StaffRow } from "@/lib/usernames";
import { printSlips, tempPassword } from "@/lib/slips";
import logo from "@/assets/galleries-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const blank: StaffRow = { username: "", temporary_password: "", first_name: "", last_name: "", role: "security", email: "" };

function downloadTemplate() {
  const csv = STAFF_TEMPLATE_HEADERS.join(",") + "\njsmith,ChangeMe123!,John,Smith,security,\n";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "new-staff-template.csv"; a.click();
}

export function StaffAccounts({ onDone }: { onDone: () => void }) {
  const create = useServerFn(createStaffAccounts);
  const [open, setOpen] = useState(false);
  const [row, setRow] = useState<StaffRow>(blank);
  const [rows, setRows] = useState<StaffRow[] | null>(null);
  const [results, setResults] = useState<{ username: string; ok: boolean; error?: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastBatch, setLastBatch] = useState<StaffRow[]>([]);
  const slipsFor = (list: StaffRow[], res: { username: string; ok: boolean }[]) =>
    list.filter((r) => res.some((x) => x.ok && x.username === r.username.trim().toLowerCase()))
      .map((r) => ({ username: r.username.trim().toLowerCase(), password: r.temporary_password, name: `${r.first_name} ${r.last_name}`.trim(), role: r.role }));
  const run = async (list: StaffRow[]) => {
    setLastBatch(list);
    setBusy(true);
    try {
      const { results } = await create({ data: { rows: list } });
      setResults(results);
      const ok = results.filter((r) => r.ok).length;
      toast.success(`${ok} of ${results.length} account(s) created`);
      onDone();
      return results;
    } catch (e) { toast.error((e as Error).message); return null; } finally { setBusy(false); }
  };
  const onFile = async (file: File) => {
    const parsed = parseCsv(await file.text()) as unknown as StaffRow[];
    setResults(null); setRows(parsed.filter((r) => r.username));
  };
  const set = (k: keyof StaffRow) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setRow({ ...row, [k]: e.target.value });
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => { setRow(blank); setResults(null); setOpen(true); }}>Add staff</Button>
      {results && slipsFor(lastBatch, results).length > 0 && <Button variant="outline" onClick={() => printSlips(slipsFor(lastBatch, results), logo.url)}>Print login slips ({slipsFor(lastBatch, results).length})</Button>}
      <Button variant="outline" onClick={downloadTemplate}>Download blank form</Button>
      <Button variant="outline" asChild><label className="cursor-pointer">Import filled form<input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} /></label></Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add staff account</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="mb-1.5 block">Username</Label><Input value={row.username} onChange={set("username")} /></div>
            <div><Label className="mb-1.5 block">Temporary password</Label><div className="flex gap-1"><Input value={row.temporary_password} onChange={set("temporary_password")} /><Button type="button" variant="outline" size="sm" onClick={() => setRow({ ...row, temporary_password: tempPassword() })}>Generate</Button></div></div>
            <div><Label className="mb-1.5 block">First name</Label><Input value={row.first_name} onChange={set("first_name")} /></div>
            <div><Label className="mb-1.5 block">Last name</Label><Input value={row.last_name} onChange={set("last_name")} /></div>
            <div><Label className="mb-1.5 block">Role</Label><select className="w-full border rounded-md h-9 px-2 bg-card" value={row.role} onChange={set("role")}>{STAFF_ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
            <div><Label className="mb-1.5 block">Email (optional)</Label><Input type="email" value={row.email} onChange={set("email")} /></div>
          </div>
          <DialogFooter><Button disabled={busy} onClick={async () => { const p = staffRowProblem(row); if (p) { toast.error(p); return; } const r = await run([row]); if (r?.[0]?.ok) setOpen(false); else if (r?.[0]) toast.error(r[0].error ?? "Failed"); }}>{busy ? "Creating…" : "Create account"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {rows && (
        <Dialog open onOpenChange={(o) => !o && setRows(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Import {rows.length} staff</DialogTitle></DialogHeader>
            <table className="w-full text-sm">
              <thead><tr className="text-left"><th>Username</th><th>Name</th><th>Role</th><th>Check</th></tr></thead>
              <tbody>{rows.map((r, i) => {
                const res = results?.find((x) => x.username === r.username.trim().toLowerCase());
                const msg = res ? (res.ok ? "Created" : res.error) : staffRowProblem(r) ?? "Ready";
                return <tr key={i} className="border-t"><td className="py-1">{r.username}</td><td>{r.first_name} {r.last_name}</td><td>{r.role}</td><td className={res?.ok || msg === "Ready" ? "text-primary" : "text-destructive"}>{msg}</td></tr>;
              })}</tbody>
            </table>
            <DialogFooter>{results ? <><Button variant="outline" disabled={!slipsFor(rows, results).length} onClick={() => printSlips(slipsFor(rows, results), logo.url)}>Print login slips</Button><Button onClick={() => setRows(null)}>Close</Button></> : <Button disabled={busy} onClick={() => run(rows.map((r) => ({ ...r, role: (r.role || "").trim().toLowerCase() })))}>{busy ? "Creating…" : "Create accounts"}</Button>}</DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
