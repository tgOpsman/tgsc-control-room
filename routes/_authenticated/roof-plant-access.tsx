import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/roof-plant-access")({
  head: () => ({
    meta: [
      { title: "Roof / Plant Access — Control Room Manager" },
      { name: "description", content: "High-risk area access — who is on the roof or in plant rooms now." },
      { property: "og:title", content: "Roof / Plant Access — Control Room Manager" },
      { property: "og:description", content: "High-risk area access — who is on the roof or in plant rooms now." },
    ],
  }),
  component: () => <ModulePage path="/roof-plant-access" />,
});
