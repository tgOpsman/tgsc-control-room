import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// UK GDPR: drag boxes over faces, number plates or card details to black them out before upload.
export function PhotoRedactor({ file, onCancel, onDone }: { file: File; onCancel: () => void; onDone: (b: Blob) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement | null>(null);
  const [boxes, setBoxes] = useState<number[][]>([]);
  const start = useRef<number[] | null>(null);
  useEffect(() => {
    const i = new Image();
    i.onload = () => { img.current = i; draw([]); };
    i.src = URL.createObjectURL(file);
  }, [file]);
  const draw = (bs: number[][]) => {
    const c = canvas.current, i = img.current;
    if (!c || !i) return;
    const scale = Math.min(1, 1600 / i.width);
    c.width = i.width * scale; c.height = i.height * scale;
    const x = c.getContext("2d")!;
    x.drawImage(i, 0, 0, c.width, c.height);
    x.fillStyle = "#000";
    bs.forEach(([a, b, w, h]) => x.fillRect(a!, b!, w!, h!));
  };
  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return [(e.clientX - r.left) * (canvas.current!.width / r.width), (e.clientY - r.top) * (canvas.current!.height / r.height)];
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Black out personal details</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Drag over faces, number plates or card details to hide them. Skip if there is nothing to hide.</p>
        <canvas ref={canvas} className="w-full rounded border touch-none cursor-crosshair"
          onPointerDown={(e) => { start.current = pos(e); }}
          onPointerUp={(e) => {
            if (!start.current) return;
            const [a, b] = start.current, [c, d] = pos(e);
            const nb = [...boxes, [Math.min(a!, c!), Math.min(b!, d!), Math.abs(c! - a!), Math.abs(d! - b!)]];
            start.current = null; setBoxes(nb); draw(nb);
          }} />
        <DialogFooter>
          <Button variant="outline" onClick={() => { setBoxes([]); draw([]); }}>Undo all</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => canvas.current?.toBlob((b) => b && onDone(b), "image/jpeg", 0.85)}>Use photo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
