import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";

export const Route = createFileRoute("/_authenticated/keys_/inventory")({
  head: () => ({
    meta: [
      { title: "Key & Pass Inventory — Control Room Manager" },
      { name: "description", content: "Every key bunch and access pass on the cabinet." },
      { property: "og:title", content: "Key & Pass Inventory — Control Room Manager" },
      { property: "og:description", content: "Every key bunch and access pass on the cabinet." },
    ],
  }),
  component: () => <ModulePage path="/keys/inventory" />,
});
