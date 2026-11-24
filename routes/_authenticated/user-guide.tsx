import { createFileRoute, Link } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { GUIDE } from "@/components/extra/guide";

export const Route = createFileRoute("/_authenticated/user-guide")({
  head: () => ({
    meta: [
      { title: "User Guide — Control Room Manager" },
      { name: "description", content: "How to use each part of the control room system." },
      { property: "og:title", content: "User Guide — Control Room Manager" },
      { property: "og:description", content: "How to use each part of the control room system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Guide,
});

function Guide() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div><h1 className="text-2xl md:text-3xl font-bold">User Guide</h1><p className="text-sm text-muted-foreground">Step-by-step help for every screen.</p></div>
        <Button variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print manual</Button>
      </div>
      <Accordion type="multiple" className="bg-card border rounded-xl px-4">
        {GUIDE.map((g) => (
          <AccordionItem key={g.title} value={g.title} className="break-inside-avoid">
            <AccordionTrigger>{g.title}</AccordionTrigger>
            <AccordionContent forceMount className="data-[state=closed]:hidden print:!block">
              <ol className="list-decimal pl-5 space-y-1 text-sm">{g.steps.map((s) => <li key={s}>{s}</li>)}</ol>
              {g.path && <Link to={g.path as "/"} className="inline-block mt-2 text-sm underline print:hidden">Open {g.title}</Link>}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
