import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TenantAutocomplete({ value, onChange, required, placeholder = "Start typing to search tenants…" }: { value: string; onChange: (v: string) => void; required?: boolean | undefined; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: tenants = [] } = useQuery({
    queryKey: ["tenant-names"],
    queryFn: async () => {
      const { data } = await supabase.from("tenants" as never).select("id,name").order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
  });
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = value ? tenants.filter((t) => t.name?.toLowerCase().includes(value.toLowerCase())) : tenants;
  return (
    <div className="relative" ref={ref}>
      <Input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder} required={required} className="pr-9" autoComplete="off" />
      <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No matches — keep typing to enter a custom destination</div>
          ) : filtered.map((t) => (
            <button key={t.id} type="button" onClick={() => { onChange(t.name); setOpen(false); }}
              className={cn("w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between", value === t.name && "bg-muted")}>
              {t.name}{value === t.name && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
