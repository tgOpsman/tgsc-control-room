import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/vacant-unit-check")({
  head: () => ({
    meta: [
      { title: "Vacant Unit Check — Control Room Manager" },
      { name: "description", content: "19-point insurance and safety inspection of empty units." },
      { property: "og:title", content: "Vacant Unit Check — Control Room Manager" },
      { property: "og:description", content: "19-point insurance and safety inspection of empty units." },
    ],
  }),
  component: () => <ModulePage path="/vacant-unit-check" />,
});
