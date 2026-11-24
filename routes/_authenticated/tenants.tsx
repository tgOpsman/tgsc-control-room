import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/app/ModulePage";
import { TenantEmail } from "@/components/team/TenantEmail";

export const Route = createFileRoute("/_authenticated/tenants")({
  head: () => ({
    meta: [
      { title: "Tenants — Control Room Manager" },
      { name: "description", content: "Units, loading bays, goods lifts and contacts." },
      { property: "og:title", content: "Tenants — Control Room Manager" },
      { property: "og:description", content: "Units, loading bays, goods lifts and contacts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (<div><div className="px-6 md:px-8 pt-6 flex justify-end max-w-[1500px] mx-auto print:hidden"><TenantEmail /></div><ModulePage path="/tenants" /></div>),
});
