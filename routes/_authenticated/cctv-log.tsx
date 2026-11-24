import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/cctv-log")({
  head: () => ({
    meta: [
      { title: "CCTV Log — Control Room Manager" },
      { name: "description", content: "Function checks, faults, footage removals and viewings (UK GDPR)." },
      { property: "og:title", content: "CCTV Log — Control Room Manager" },
      { property: "og:description", content: "Function checks, faults, footage removals and viewings (UK GDPR)." },
    ],
  }),
  component: () => <ModulePage path="/cctv-log" />,
});
