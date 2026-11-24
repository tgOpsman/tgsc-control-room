import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/out-of-hours")({
  head: () => ({
    meta: [
      { title: "Out of Hours Contacts — Control Room Manager" },
      { name: "description", content: "Emergency key holders for each tenant." },
      { property: "og:title", content: "Out of Hours Contacts — Control Room Manager" },
      { property: "og:description", content: "Emergency key holders for each tenant." },
    ],
  }),
  component: () => <ModulePage path="/out-of-hours" />,
});
