import { createFileRoute } from "@tanstack/react-router";
import { LoanDesk } from "@/components/loans/LoanDesk";

export const Route = createFileRoute("/_authenticated/equipment")({
  head: () => ({
    meta: [
      { title: "Equipment Log — Control Room Manager" },
      { name: "description", content: "Radios, bodycams and patrol phones signed in and out." },
      { property: "og:title", content: "Equipment Log — Control Room Manager" },
      { property: "og:description", content: "Radios, bodycams and patrol phones signed in and out." },
    ],
  }),
  component: () => <LoanDesk kind="equipment" />,
});
