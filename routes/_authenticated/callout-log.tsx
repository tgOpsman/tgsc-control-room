import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/callout-log")({
  head: () => ({
    meta: [
      { title: "Contractor Callout Log — Control Room Manager" },
      { name: "description", content: "Equipment faults, contractor callouts and attendance." },
      { property: "og:title", content: "Contractor Callout Log — Control Room Manager" },
      { property: "og:description", content: "Equipment faults, contractor callouts and attendance." },
    ],
  }),
  component: () => <ModulePage path="/callout-log" />,
});
