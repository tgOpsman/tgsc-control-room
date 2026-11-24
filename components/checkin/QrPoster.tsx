import { useState } from "react";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/** Opens a printable poster with this site's visitor check-in QR code. */
export function QrPosterButton() {
  const [busy, setBusy] = useState(false);
  const open = async () => {
    setBusy(true);
    try {
      const { data: roomId } = await supabase.rpc("current_room");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from("control_rooms").select("name,checkin_token").eq("id", roomId).single();
      if (error || !data) throw new Error("Could not load your site's QR key");
      const url = `${window.location.origin}/visitor-checkin?room=${data.checkin_token}`;
      const img = await QRCode.toDataURL(url, { width: 700, margin: 1 });
      const w = window.open("", "_blank");
      if (!w) throw new Error("Allow pop-ups to print the poster");
      const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
      w.document.write(`<!doctype html><title>Visitor check-in QR</title><body style="font-family:Inter,sans-serif;text-align:center;padding:40px;color:#0f1e3d">
        <h1 style="font-size:48px;margin:0">Visitors &amp; Contractors</h1><h2 style="font-weight:500">Scan to sign in at ${esc(data.name)}</h2>
        <img src="${img}" style="width:420px;height:420px"/><p style="font-size:20px">Point your phone camera at the code.<br/>Please sign out when you leave.</p>
        <p style="font-size:12px;color:#666;word-break:break-all">${esc(url)}</p><script>onload=()=>print()</script></body>`);
      w.document.close();
    } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };
  return <Button size="sm" variant="outline" disabled={busy} onClick={open}><QrCode className="h-4 w-4" /> QR poster</Button>;
}
