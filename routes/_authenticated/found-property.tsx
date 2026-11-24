import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/found-property")({
  head: () => ({
    meta: [
      { title: "Lost & Found — Control Room Manager" },
      { name: "description", content: "Cross-check found items against lost reports. Card details shredded end of day; low-value items disposed end of day." },
      { property: "og:title", content: "Lost & Found — Control Room Manager" },
      { property: "og:description", content: "Cross-check found items against lost reports. Card details shredded end of day; low-value items disposed end of day." },
    ],
  }),
  component: () => <ModulePage path="/found-property" />,
});
