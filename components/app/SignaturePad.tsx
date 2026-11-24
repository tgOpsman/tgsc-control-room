import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

/** Finger/mouse signature. Calls onChange with a PNG blob, or null when cleared. */
export function SignaturePad({ onChange }: { onChange: (b: Blob | null) => void }) {
  const c = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  useEffect(() => {
    const el = c.current!; el.width = el.offsetWidth * 2; el.height = 320;
    const x = el.getContext("2d")!; x.lineWidth = 4; x.lineCap = "round"; x.strokeStyle = "#0f1e3d";
  }, []);
  const p = (e: React.PointerEvent) => { const r = c.current!.getBoundingClientRect(); return [(e.clientX - r.left) * 2, (e.clientY - r.top) * (320 / r.height)] as const; };
  const done = () => { drawing.current = false; c.current!.toBlob((b) => onChange(b), "image/png"); };
  return (
    <div>
      <canvas ref={c} className="w-full h-40 border-2 border-dashed rounded-md bg-card touch-none"
        onPointerDown={(e) => { drawing.current = true; const ctx = c.current!.getContext("2d")!; ctx.beginPath(); ctx.moveTo(...p(e)); }}
        onPointerMove={(e) => { if (!drawing.current) return; const ctx = c.current!.getContext("2d")!; ctx.lineTo(...p(e)); ctx.stroke(); }}
        onPointerUp={done} onPointerLeave={() => drawing.current && done()} />
      <Button type="button" variant="link" size="sm" className="px-0" onClick={() => { const el = c.current!; el.getContext("2d")!.clearRect(0, 0, el.width, el.height); onChange(null); }}>Clear signature</Button>
    </div>
  );
}
