import { createFileRoute } from "@tanstack/react-router";
import { PatrolRunner } from "@/components/patrol/PatrolRunner";

export const Route = createFileRoute("/_authenticated/car-park-patrol")({
  head: () => ({
    meta: [
      { title: "Car Park Patrol — Control Room Manager" },
      { name: "description", content: "Patrols of Levels N, K, F and the Tenant Car Park." },
      { property: "og:title", content: "Car Park Patrol — Control Room Manager" },
      { property: "og:description", content: "Patrols of Levels N, K, F and the Tenant Car Park." },
    ],
  }),
  component: PatrolRunner,
});
