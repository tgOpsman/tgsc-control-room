import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/spillage-log")({
  head: () => ({
    meta: [
      { title: "Spillage Log — Control Room Manager" },
      { name: "description", content: "Spillages reported, made safe and cleaned." },
      { property: "og:title", content: "Spillage Log — Control Room Manager" },
      { property: "og:description", content: "Spillages reported, made safe and cleaned." },
    ],
  }),
  component: () => <ModulePage path="/spillage-log" />,
});
