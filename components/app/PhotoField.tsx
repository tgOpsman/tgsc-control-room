import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signedUrl, uploadFile } from "@/lib/files";
import { PhotoRedactor } from "./PhotoRedactor";

export function PhotoField({ value, onChange, folder }: { value: string; onChange: (v: string) => void; folder: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (value) signedUrl(value).then(setUrl); else setUrl(""); }, [value]);
  const save = async (b: Blob) => {
    setBusy(true);
    try { onChange(await uploadFile(b, folder)); } catch (e) { toast.error((e as Error).message); }
    setBusy(false); setPending(null);
  };
  return (
    <div className="space-y-2">
      <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && setPending(e.target.files[0])} />
      {url ? (
        <div className="relative inline-block">
          <img src={url} alt="Attached" className="h-28 rounded-md border object-cover" />
          <button type="button" onClick={() => onChange("")} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5" aria-label="Remove photo"><X className="h-3 w-3" /></button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}><Camera className="h-4 w-4" /> {busy ? "Uploading…" : "Take / add photo"}</Button>
      )}
      {pending && <PhotoRedactor file={pending} onCancel={() => setPending(null)} onDone={save} />}
    </div>
  );
}
