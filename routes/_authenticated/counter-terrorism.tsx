import { createFileRoute } from "@tanstack/react-router";
import { CounterTerrorismPage } from "@/components/ct/CounterTerrorismPage";

export const Route = createFileRoute("/_authenticated/counter-terrorism")({
  head: () => ({
    meta: [
      { title: "Counter Terrorism — Control Room Manager" },
      { name: "description", content: "CT incidents. On a bomb threat: stay calm, keep the caller talking, record exact words, note caller ID, dial 999." },
      { property: "og:title", content: "Counter Terrorism — Control Room Manager" },
      { property: "og:description", content: "CT incidents. On a bomb threat: stay calm, keep the caller talking, record exact words, note caller ID, dial 999." },
    ],
  }),
  component: CounterTerrorismPage,
});
