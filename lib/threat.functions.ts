import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseThreatLevel } from "./threat";

/** Reads the current official UK threat level from GOV.UK. */
export const fetchUkThreatLevel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    try {
      const res = await fetch("https://www.gov.uk/api/content/terrorism-national-emergency", { headers: { accept: "application/json" } });
      if (!res.ok) return { level: null as string | null };
      return { level: parseThreatLevel(await res.text()) };
    } catch {
      return { level: null as string | null };
    }
  });
