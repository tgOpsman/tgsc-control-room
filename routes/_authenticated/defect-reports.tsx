import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/defect-reports")({
  head: () => ({
    meta: [
      { title: "Site Defect Reports — Control Room Manager" },
      { name: "description", content: "Defects found around site and their resolution." },
      { property: "og:title", content: "Site Defect Reports — Control Room Manager" },
      { property: "og:description", content: "Defects found around site and their resolution." },
    ],
  }),
  component: () => <ModulePage path="/defect-reports" />,
});
