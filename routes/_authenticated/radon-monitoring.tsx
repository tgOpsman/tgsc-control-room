import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/radon-monitoring")({
  head: () => ({
    meta: [
      { title: "Radon Monitoring — Control Room Manager" },
      { name: "description", content: "UK HSE workplace levels: target 200 Bq/m³, action 400 Bq/m³." },
      { property: "og:title", content: "Radon Monitoring — Control Room Manager" },
      { property: "og:description", content: "UK HSE workplace levels: target 200 Bq/m³, action 400 Bq/m³." },
    ],
  }),
  component: () => <ModulePage path="/radon-monitoring" />,
});
