import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CloudOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { discardQueued, flushQueue, onQueueChange, readQueue, type Queued } from "@/lib/offline-queue";
import { Button } from "@/components/ui/button";

/** Amber bar while offline or while entries wait to sync. */
export function OfflineBanner() {
  const qc = useQueryClient();
  const [online, setOnline] = useState(true);
  const [q, setQ] = useState<Queued[]>([]);
  useEffect(() => {
    const upd = () => { setOnline(navigator.onLine); setQ(readQueue()); };
    const sync = async () => {
      upd();
      const { synced } = await flushQueue();
      if (synced) { toast.success(`Back online — ${synced} saved ${synced === 1 ? "entry" : "entries"} uploaded`); qc.invalidateQueries(); }
    };
    void sync();
    const off = onQueueChange(upd);
    window.addEventListener("online", sync); window.addEventListener("offline", upd);
    const t = setInterval(sync, 30000);
    return () => { off(); window.removeEventListener("online", sync); window.removeEventListener("offline", upd); clearInterval(t); };
  }, [qc]);
  const failed = q.filter((x) => x.error);
  if (online && !q.length) return null;
  return (
    <div className="bg-accent text-accent-foreground text-sm print:hidden">
      <div className="max-w-[1500px] mx-auto px-4 py-2 flex flex-wrap items-center gap-3">
        <CloudOff className="h-4 w-4" />
        <span className="font-medium">{online ? "Uploading saved entries…" : "Working offline"} — {q.length} {q.length === 1 ? "entry" : "entries"} saved on this device</span>
        {online && <Button size="sm" variant="secondary" className="h-7" onClick={() => flushQueue()}><RefreshCw className="h-3.5 w-3.5" /> Retry now</Button>}
        {failed.map((f) => (
          <span key={f.id} className="flex items-center gap-2">· Could not upload a {f.table.replace(/_/g, " ")} entry ({f.error})
            <Button size="sm" variant="secondary" className="h-7" onClick={() => discardQueued(f.id)}>Discard</Button></span>
        ))}
      </div>
    </div>
  );
}
