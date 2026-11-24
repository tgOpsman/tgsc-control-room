import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { INCIDENT_CATEGORIES, SEVERITIES, DESTINATIONS, type IncidentDraft } from "./incident-ai";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "category", "severity", "summary", "location", "people_involved", "actions", "destination"],
  properties: {
    title: { type: "string" },
    category: { type: "string", enum: [...INCIDENT_CATEGORIES] },
    severity: { type: "string", enum: [...SEVERITIES] },
    summary: { type: "string" },
    location: { type: "string" },
    people_involved: { type: "string" },
    actions: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["action", "priority", "owner"],
        properties: { action: { type: "string" }, priority: { type: "string", enum: ["Immediate", "Today", "Follow-up"] }, owner: { type: "string" } },
      },
    },
    destination: { type: "string", enum: DESTINATIONS.map((d) => d.path) },
  },
} as const;

const SYSTEM = `You are a senior UK shopping centre control room supervisor at The Galleries Shopping Centre (TGSC).
Turn an operator's rough note into a factual, objective incident report in British English.
Never invent facts: if a detail (time, name, location) is not given, write "Not stated".
Do not include speculation about identity, ethnicity or guilt; keep personal data minimal (UK GDPR).
Recommend practical follow-up actions (e.g. preserve CCTV, inform duty manager, cordon area, call 999, raise defect, notify tenant, complete RIDDOR check).
Use Critical only for immediate risk to life or terrorism indicators, and include calling 999 / following NaCTSO guidance when relevant.
Pick the destination log that best fits.`;

export const draftIncidentReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ note: z.string().trim().min(10, "Please add a bit more detail").max(4000) }).parse(d))
  .handler(async ({ data }): Promise<{ draft: IncidentDraft | null; error: string | null }> => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM,
        input: data.note,
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: "incident_report", strict: true, schema } },
      });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") for (const c of item.content) if (c.type === "output_text") text += c.text;
      }
      if (!text) return { draft: null, error: "The assistant didn't return a draft. Please try again." };
      return { draft: JSON.parse(text) as IncidentDraft, error: null };
    } catch (e) {
      console.error("incident draft failed", e);
      if (e instanceof GatewayError) {
        const code = e.httpStatus;
        if (code === 429) return { draft: null, error: "Too many requests right now. Please wait a minute and try again." };
        if (code === 402) return { draft: null, error: "AI credits have run out. Please top up to keep using drafting." };
      }
      return { draft: null, error: "Couldn't draft the report. Your note is kept — please try again." };
    }
  });
