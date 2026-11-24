import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/equipment_/inventory")({
  head: () => ({
    meta: [
      { title: "Equipment Inventory — Control Room Manager" },
      { name: "description", content: "Radios, bodycams and patrol phones held on site." },
      { property: "og:title", content: "Equipment Inventory — Control Room Manager" },
      { property: "og:description", content: "Radios, bodycams and patrol phones held on site." },
    ],
  }),
  component: () => <ModulePage path="/equipment/inventory" />,
});
