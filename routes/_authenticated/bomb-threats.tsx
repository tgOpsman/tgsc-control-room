import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/bomb-threats")({
  head: () => ({
    meta: [
      { title: "Bomb Threat Reports — Control Room Manager" },
      { name: "description", content: "NaCTSO bomb threat checklist." },
      { property: "og:title", content: "Bomb Threat Reports — Control Room Manager" },
      { property: "og:description", content: "NaCTSO bomb threat checklist." },
    ],
  }),
  component: () => <ModulePage path="/bomb-threats" />,
});
