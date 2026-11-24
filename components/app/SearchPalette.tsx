import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { canSee, useAuth } from "@/lib/auth";
import { NAV, GROUPS } from "@/lib/nav";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const { role, pages } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const items = NAV.filter((n) => canSee(role, n.roles, pages, n.path));
  const groups = [{ id: "top", label: "Main" }, ...GROUPS];
  return (
    <>
      <button onClick={() => setOpen(true)} title="Search (Ctrl+K)" className="px-3 py-1.5 rounded-md text-sm hover:bg-sidebar-accent flex items-center gap-2">
        <Search className="h-4 w-4" /><span className="hidden xl:inline">Search</span>
        <kbd className="hidden xl:inline text-[10px] font-mono opacity-60 border border-sidebar-border rounded px-1">Ctrl K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Jump to a page or log…" />
        <CommandList>
          <CommandEmpty>No matching pages.</CommandEmpty>
          {groups.map((g) => {
            const sub = items.filter((i) => i.group === g.id);
            if (!sub.length) return null;
            return (
              <CommandGroup key={g.id} heading={g.label}>
                {sub.map((i) => (
                  <CommandItem key={i.path} value={`${i.label} ${i.path}`} onSelect={() => { setOpen(false); navigate({ to: i.path as "/" }); }}>{i.label}</CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
