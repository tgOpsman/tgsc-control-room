import { createFileRoute } from "@tanstack/react-router";
import { HandoverPage } from "@/components/handover/HandoverPage";

export const Route = createFileRoute("/_authenticated/handover")({
  head: () => ({
    meta: [
      { title: "Daily Handover — Control Room Manager" },
      { name: "description", content: "Shift handover with equipment and systems checklist." },
      { property: "og:title", content: "Daily Handover — Control Room Manager" },
      { property: "og:description", content: "Shift handover with equipment and systems checklist." },
    ],
  }),
  component: HandoverPage,
});
