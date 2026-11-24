import { createFileRoute } from "@tanstack/react-router";
import { CheckOffPage } from "@/components/team/CheckOffPage";

export const Route = createFileRoute("/_authenticated/shift-checkoff")({
  head: () => ({
    meta: [
      { title: "Shift Check Off — Control Room Manager" },
      { name: "description", content: "Daily hours verification." },
      { property: "og:title", content: "Shift Check Off — Control Room Manager" },
      { property: "og:description", content: "Daily hours verification." },
    ],
  }),
  component: CheckOffPage,
});
