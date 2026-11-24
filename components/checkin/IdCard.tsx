import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type P = { ref: string; name: string; site: string; type?: string; company?: string; destination?: string; issued?: string };
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleString("en-GB", { timeZone: "Europe/London", ...o });

/** On-device ID badge for anyone signed in via the QR code. The live clock deters screenshots. */
export function IdCard({ pass, logo }: { pass: P; logo: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const [full, setFull] = useState(false);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const type = (pass.type || "Visitor").toUpperCase();
  const issued = pass.issued ? new Date(pass.issued) : null;
  const card = (
    <div className={`bg-card border-2 border-accent rounded-2xl overflow-hidden text-center ${full ? "w-full max-w-md" : ""}`}>
      <div className="bg-primary p-3 flex justify-center"><img src={logo} alt="The Galleries" className="h-10 w-auto" /></div>
      <div className="bg-accent text-accent-foreground py-3 text-3xl font-black tracking-widest">{type}</div>
      <div className="p-5 space-y-2">
        <h1 className="text-3xl font-bold break-words">{pass.name}</h1>
        {pass.company && <p className="text-lg">{pass.company}</p>}
        {pass.destination && <p className="text-sm text-muted-foreground">Visiting: {pass.destination}</p>}
        <div className="font-mono text-xl pt-1">{pass.ref}</div>
        <div className="text-xs text-muted-foreground">{pass.site}{issued && ` · Issued ${fmt(issued, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`}</div>
        <div className="text-sm font-semibold">Valid today only</div>
        <div className="font-mono text-2xl tabular-nums animate-pulse">{now ? fmt(now, { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}</div>
      </div>
    </div>
  );
  if (full) return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-4 gap-4">
      {card}
      <Button variant="outline" onClick={() => setFull(false)}><X className="h-4 w-4" /> Close</Button>
    </div>
  );
  return <div className="space-y-2">{card}<Button variant="outline" className="w-full" onClick={() => setFull(true)}><Maximize2 className="h-4 w-4" /> Show to security</Button></div>;
}
