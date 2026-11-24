import { Textarea } from "@/components/ui/textarea";
import type { ChecklistValue } from "@/lib/refs";

const OPTS = [["yes", "Yes", "bg-success text-success-foreground"], ["no", "No", "bg-destructive text-destructive-foreground"], ["na", "N/A", "bg-muted-foreground text-background"]] as const;

export function ToggleQuestion({ label, value, onChange, allowNA = true, invalid }: { label: string; value: ChecklistValue; onChange: (v: ChecklistValue) => void; allowNA?: boolean; invalid?: boolean }) {
  return (
    <div className="py-2.5 border-b last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm">{label}</span>
        <div className="flex gap-1">
          {OPTS.filter(([k]) => allowNA || k !== "na").map(([k, l, on]) => (
            <button key={k} type="button" onClick={() => onChange({ ...value, answer: k })}
              className={`px-3 py-1 rounded-md text-xs font-semibold border ${value.answer === k ? on : "bg-card hover:bg-muted"}`}>{l}</button>
          ))}
        </div>
      </div>
      {(value.answer === "no" || value.comments) && (
        <Textarea rows={2} className={`mt-2 text-sm ${invalid ? "border-destructive" : ""}`} value={value.comments ?? ""}
          placeholder={value.answer === "no" ? "Comments (required)…" : "Comments…"} onChange={(e) => onChange({ ...value, comments: e.target.value })} />
      )}
    </div>
  );
}
