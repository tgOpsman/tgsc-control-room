import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { canSee, useAuth } from "@/lib/auth";
import { NAV } from "@/lib/nav";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const QUICK = ["/incident-assistant", "/checkin", "/site-checkin", "/barrier-log", "/keys", "/car-park-patrol", "/equipment", "/spillage-log", "/defect-reports", "/found-property", "/callout-log", "/weather-log", "/counter-terrorism"];

export function QuickLogMenu() {
  const { role, pages } = useAuth();
  const items = QUICK.map((p) => NAV.find((n) => n.path === p)).filter((n) => n && canSee(role, n.roles, pages, n.path));
  if (!items.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="px-3 py-1.5 rounded-md text-sm whitespace-nowrap bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 flex items-center gap-1 font-medium">
        <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Quick Log</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel>Log something now</DropdownMenuLabel>
        {items.map((i) => (
          <DropdownMenuItem key={i!.path} asChild>
            <Link to={i!.path as "/"} search={{ new: 1 } as never}>{i!.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
