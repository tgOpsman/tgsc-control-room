import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { db, fmt } from "@/lib/db";
import { isLoanOverdue, isPatrolStale } from "@/lib/overdue";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
export function OverdueAlerts() {
  const { data } = useQuery({
    queryKey: ["overdue"], refetchInterval: 60000,
    queryFn: async () => {
      const [k, a, p] = await Promise.all([
        db("key_logs").select("id,item_label,issued_to,issued_at").eq("status", "out"),
        db("asset_logs").select("id,asset_label,issued_to,issued_at").eq("status", "out"),
        db("car_park_patrols").select("id,officer_name,patrol_start").eq("status", "active"),
      ]);
      return {
        keys: ((k.data ?? []) as Row[]).filter((r) => isLoanOverdue(r.issued_at)),
        kit: ((a.data ?? []) as Row[]).filter((r) => isLoanOverdue(r.issued_at)),
        patrols: ((p.data ?? []) as Row[]).filter((r) => isPatrolStale(r.patrol_start)),
      };
    },
  });
  const total = (data?.keys.length ?? 0) + (data?.kit.length ?? 0) + (data?.patrols.length ?? 0);
  const Section = ({ title, rows, to, label, when }: { title: string; rows: Row[]; to: string; label: (r: Row) => string; when: (r: Row) => string }) => (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2"><h3 className="font-semibold">{title} ({rows.length})</h3><Link to={to as "/"} className="text-xs underline">Open</Link></div>
      {rows.length ? rows.map((r) => <div key={r.id} className="border rounded-lg p-2 mb-1 text-sm"><div className="font-medium">{label(r)}</div><div className="text-xs text-muted-foreground">Since {fmt(when(r))}</div></div>)
        : <div className="text-sm text-muted-foreground">Nothing overdue.</div>}
    </div>
  );
  return (
    <Sheet>
      <SheetTrigger className="relative p-2 rounded-md hover:bg-sidebar-accent" aria-label="Overdue alerts">
        <Bell className="h-4 w-4" />
        {total > 0 && <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">{total}</span>}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>Overdue alerts</SheetTitle></SheetHeader>
        <div className="mt-4">
          <Section title="Keys out over 24h" rows={data?.keys ?? []} to="/keys" label={(r) => `${r.item_label ?? "Key"} — ${r.issued_to}`} when={(r) => r.issued_at} />
          <Section title="Equipment out over 24h" rows={data?.kit ?? []} to="/equipment" label={(r) => `${r.asset_label ?? "Item"} — ${r.issued_to}`} when={(r) => r.issued_at} />
          <Section title="Patrols running over 12h" rows={data?.patrols ?? []} to="/car-park-patrol" label={(r) => r.officer_name} when={(r) => r.patrol_start} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
