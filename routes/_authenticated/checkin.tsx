import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/checkin")({
  head: () => ({
    meta: [
      { title: "Vehicle Check In/Out — Control Room Manager" },
      { name: "description", content: "Log vehicles arriving and leaving site." },
      { property: "og:title", content: "Vehicle Check In/Out — Control Room Manager" },
      { property: "og:description", content: "Log vehicles arriving and leaving site." },
    ],
  }),
  component: () => <ModulePage path="/checkin" />,
});
