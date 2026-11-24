import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/barrier-log")({
  head: () => ({
    meta: [
      { title: "Barrier Log — Control Room Manager" },
      { name: "description", content: "Manual barrier, shutter and door raises." },
      { property: "og:title", content: "Barrier Log — Control Room Manager" },
      { property: "og:description", content: "Manual barrier, shutter and door raises." },
    ],
  }),
  component: () => <ModulePage path="/barrier-log" />,
});
