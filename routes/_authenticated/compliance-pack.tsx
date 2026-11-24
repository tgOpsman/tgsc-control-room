import { createFileRoute } from "@tanstack/react-router";
import { CompliancePack } from "@/components/team/CompliancePack";

export const Route = createFileRoute("/_authenticated/compliance-pack")({
  head: () => ({
    meta: [
      { title: "Monthly Compliance Pack — Control Room Manager" },
      { name: "description", content: "Nine compliance areas with month-on-month change and manager sign-off." },
      { property: "og:title", content: "Monthly Compliance Pack — Control Room Manager" },
      { property: "og:description", content: "Nine compliance areas with month-on-month change and manager sign-off." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompliancePack,
});
