import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/keys_/audit")({
  head: () => ({
    meta: [
      { title: "Key Audit — Control Room Manager" },
      { name: "description", content: "Monthly key cabinet audits and outstanding issues." },
      { property: "og:title", content: "Key Audit — Control Room Manager" },
      { property: "og:description", content: "Monthly key cabinet audits and outstanding issues." },
    ],
  }),
  component: () => <ModulePage path="/keys/audit" />,
});
