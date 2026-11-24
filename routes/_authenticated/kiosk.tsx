import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LoanDesk } from "@/components/loans/LoanDesk";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/kiosk")({
  head: () => ({
    meta: [
      { title: "Kiosk — Control Room Manager" },
      { name: "description", content: "Full-screen self-service sign-out for keys and radios." },
      { property: "og:title", content: "Kiosk — Control Room Manager" },
      { property: "og:description", content: "Full-screen self-service sign-out for keys and radios." },
    ],
  }),
  component: Kiosk,
});

function Kiosk() {
  const [k, setK] = useState<"keys" | "equipment">("keys");
  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-3xl font-bold">Kiosk</h1>
        <div className="flex gap-2">
          <Button size="lg" variant={k === "keys" ? "default" : "outline"} onClick={() => setK("keys")}>Keys & passes</Button>
          <Button size="lg" variant={k === "equipment" ? "default" : "outline"} onClick={() => setK("equipment")}>Radios & equipment</Button>
          <Button size="lg" variant="outline" onClick={() => document.documentElement.requestFullscreen?.()}>Full screen</Button>
        </div>
      </div>
      <LoanDesk key={k} kind={k} kiosk />
    </div>
  );
}
