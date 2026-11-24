import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/fire-logbook")({
  head: () => ({
    meta: [
      { title: "Fire LogBook — Control Room Manager" },
      { name: "description", content: "Fire events, BGU tests, unit tests, sprinklers, drills and door releases." },
      { property: "og:title", content: "Fire LogBook — Control Room Manager" },
      { property: "og:description", content: "Fire events, BGU tests, unit tests, sprinklers, drills and door releases." },
    ],
  }),
  component: () => <ModulePage path="/fire-logbook" />,
});
