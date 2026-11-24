import { createFileRoute } from "@tanstack/react-router";
import { RosterGrid } from "@/components/team/RosterGrid";

export const Route = createFileRoute("/_authenticated/team-rostering")({
  head: () => ({
    meta: [
      { title: "Team Rostering — Control Room Manager" },
      { name: "description", content: "Shift codes: D 05:30–17:30 · N 17:30–05:30 · E 06:15–16:15 · B 08:15–18:15 · M 11:30–19:30 · L 14:30–23:30 · SD 07:30–17:30 · SB 09:30–17:30." },
      { property: "og:title", content: "Team Rostering — Control Room Manager" },
      { property: "og:description", content: "Shift codes: D 05:30–17:30 · N 17:30–05:30 · E 06:15–16:15 · B 08:15–18:15 · M 11:30–19:30 · L 14:30–23:30 · SD 07:30–17:30 · SB 09:30–17:30." },
    ],
  }),
  component: RosterGrid,
});
