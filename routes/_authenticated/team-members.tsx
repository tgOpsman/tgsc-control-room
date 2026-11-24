import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/team-members")({
  head: () => ({
    meta: [
      { title: "Team Members — Control Room Manager" },
      { name: "description", content: "Dual Service and Cleaning colleagues." },
      { property: "og:title", content: "Team Members — Control Room Manager" },
      { property: "og:description", content: "Dual Service and Cleaning colleagues." },
    ],
  }),
  component: () => <ModulePage path="/team-members" />,
});
