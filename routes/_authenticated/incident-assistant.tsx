import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { draftIncidentReport } from "@/lib/incident-ai.functions";
import { DESTINATIONS, draftToText, type IncidentDraft } from "@/lib/incident-ai";

export const Route = createFileRoute("/_authenticated/incident-assistant")({
  head: () => ({ meta: [
    { title: "Incident Report Assistant · Control Room Manager" },
    { name: "description", content: "Turn a quick note into a categorised incident report with recommended actions." },
    { property: "og:title", content: "Incident Report Assistant · Control Room Manager" },
    { property: "og:description", content: "AI-drafted incident reports with follow-up actions." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

const sevColour: Record<string, string> = { Low: "secondary", Medium: "outline", High: "default", Critical: "destructive" };

function Page() {
  const draftFn = useServerFn(draftIncidentReport);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<IncidentDraft | null>(null);
  const [done, setDone] = useState<Record<number, boolean>>({});

  async function run() {
    if (note.trim().length < 10) { toast.error("Please add a bit more detail"); return; }
    setBusy(true);
    try {
      const r = await draftFn({ data: { note } });
      if (r.error || !r.draft) toast.error(r.error ?? "No draft returned");
      else { setDraft(r.draft); setDone({}); }
    } catch { toast.error("Couldn't reach the assistant. Please try again."); }
    finally { setBusy(false); }
  }
  const dest = draft && DESTINATIONS.find((d) => d.path === draft.destination);

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-accent" /> Incident Report Assistant</h1>
        <p className="text-sm text-muted-foreground">Type what happened in your own words. The assistant drafts a report — always check it before filing.</p>
      </div>
      <Card><CardContent className="pt-6 space-y-3">
        <Textarea rows={6} maxLength={4000} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. 14:10 radio from patrol — water leaking from ceiling outside Boots, lower mall, floor wet, cones placed…" />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{note.length}/4000 · avoid unnecessary personal details</span>
          <Button onClick={run} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Draft report</Button>
        </div>
      </CardContent></Card>

      {draft && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div className="space-y-2">
              <CardTitle>{draft.title}</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{draft.category}</Badge>
                <Badge variant={sevColour[draft.severity] as "default"}>{draft.severity}</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(draftToText(draft)); toast.success("Copied"); }}><Copy className="h-4 w-4" /> Copy</Button>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid sm:grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Location:</span> {draft.location}</div>
              <div><span className="text-muted-foreground">People involved:</span> {draft.people_involved}</div>
            </div>
            <Textarea rows={6} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
            <div>
              <h3 className="font-semibold mb-2">Recommended actions</h3>
              <ul className="space-y-2">
                {draft.actions.map((a, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <Checkbox checked={!!done[i]} onCheckedChange={(v) => setDone({ ...done, [i]: !!v })} className="mt-0.5" />
                    <span className={done[i] ? "line-through text-muted-foreground" : ""}>
                      <Badge variant={a.priority === "Immediate" ? "destructive" : "secondary"} className="mr-2">{a.priority}</Badge>
                      {a.action} <span className="text-muted-foreground">— {a.owner}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {dest && (
              <Button asChild><Link to={dest.path as "/"} search={{ new: 1 } as never}>File it in {dest.label}</Link></Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
