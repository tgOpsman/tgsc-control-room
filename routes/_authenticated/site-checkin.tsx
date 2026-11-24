import { createFileRoute } from "@tanstack/react-router";
import { SiteCheckInPage } from "@/components/checkin/SiteCheckInPage";

export const Route = createFileRoute("/_authenticated/site-checkin")({
  head: () => ({
    meta: [
      { title: "Person Check In/Out — Control Room Manager" },
      { name: "description", content: "Visitors, contractors, staff and agency signing in." },
      { property: "og:title", content: "Person Check In/Out — Control Room Manager" },
      { property: "og:description", content: "Visitors, contractors, staff and agency signing in." },
    ],
  }),
  component: SiteCheckInPage,
});
