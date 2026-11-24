import { createFileRoute } from "@tanstack/react-router";
import { LoanDesk } from "@/components/loans/LoanDesk";

export const Route = createFileRoute("/_authenticated/keys")({
  head: () => ({
    meta: [
      { title: "Key Log — Control Room Manager" },
      { name: "description", content: "Keys and access passes signed out and returned." },
      { property: "og:title", content: "Key Log — Control Room Manager" },
      { property: "og:description", content: "Keys and access passes signed out and returned." },
    ],
  }),
  component: () => <LoanDesk kind="keys" />,
});
