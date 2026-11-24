import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/contractors")({
  head: () => ({
    meta: [
      { title: "Contractor Inventory — Control Room Manager" },
      { name: "description", content: "Approved contractors, services and emergency numbers." },
      { property: "og:title", content: "Contractor Inventory — Control Room Manager" },
      { property: "og:description", content: "Approved contractors, services and emergency numbers." },
    ],
  }),
  component: () => <ModulePage path="/contractors" />,
});
